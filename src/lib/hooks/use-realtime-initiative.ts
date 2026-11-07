'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InitiativeEntryWithToken, Token } from '@/lib/types'

interface Options {
  sceneId: string
  initialInitiative: InitiativeEntryWithToken[]
  enabled?: boolean
}
const displayFields = [
  'name',
  'image_url',
  'character_id',
  'entity_id',
  'hp_current',
  'hp_max',
  'color',
  'is_hidden',
  'conditions',
  'size',
  'owner_id',
] as const satisfies readonly (keyof Token)[]

export function useRealtimeInitiative({ sceneId, initialInitiative, enabled = true }: Options) {
  const [snapshot, setSnapshot] = useState({
    sceneId,
    input: initialInitiative,
    enabled,
    entries: initialInitiative,
  })
  if (
    snapshot.sceneId !== sceneId ||
    snapshot.input !== initialInitiative ||
    snapshot.enabled !== enabled
  ) {
    setSnapshot({
      sceneId,
      input: initialInitiative,
      enabled,
      entries:
        snapshot.sceneId !== sceneId || snapshot.input !== initialInitiative
          ? initialInitiative
          : snapshot.entries,
    })
  }
  const latest = useRef(snapshot)
  useLayoutEffect(() => {
    latest.current = snapshot
  }, [snapshot])

  useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    let active = true
    let running = false
    let queued = false
    let generation = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = () => {
      if (active && !running && timer === undefined) timer = setTimeout(() => void refresh(), 40)
    }
    const invalidate = () => {
      if (!active) return
      generation++
      queued = true
      schedule()
    }
    const refresh = async () => {
      timer = undefined
      if (!active || !queued) return
      queued = false
      running = true
      const version = generation
      const input = latest.current.input
      const current = () =>
        active &&
        version === generation &&
        latest.current.input === input &&
        latest.current.sceneId === sceneId &&
        latest.current.enabled
      try {
        const { data, error } = await supabase
          .from('initiative')
          .select('*, token:tokens (*)')
          .eq('scene_id', sceneId)
          .order('turn_order')
          .order('id')
        if (!current() || error || !data) return
        const entries = data.flatMap((row) => {
          const token = Array.isArray(row.token) ? row.token[0] : row.token
          return token ? [{ ...row, token } as InitiativeEntryWithToken] : []
        })
        const characterIds = [
          ...new Set(entries.map((e) => e.token.character_id).filter((id): id is string => !!id)),
        ]
        const entityIds = [
          ...new Set(entries.map((e) => e.token.entity_id).filter((id): id is string => !!id)),
        ]
        const empty = { data: [] as { id: string; data_json: unknown }[], error: null }
        const [characters, entities] = await Promise.all([
          characterIds.length
            ? supabase.from('characters').select('id, data_json').in('id', characterIds)
            : empty,
          entityIds.length
            ? supabase.from('entities').select('id, data_json').in('id', entityIds)
            : empty,
        ])
        if (!current() || characters.error || entities.error) return
        const armor = (rows: { id: string; data_json: unknown }[]) =>
          new Map(
            rows.flatMap((row) => {
              const ac = (row.data_json as { ac?: unknown } | null)?.ac
              return typeof ac === 'number' && Number.isFinite(ac) ? [[row.id, ac] as const] : []
            })
          )
        const characterArmor = armor(characters.data ?? [])
        const entityArmor = armor(entities.data ?? [])
        const enriched = entries.map((entry) => ({
          ...entry,
          token: {
            ...entry.token,
            ac:
              (entry.token.character_id
                ? characterArmor.get(entry.token.character_id)
                : undefined) ??
              (entry.token.entity_id ? entityArmor.get(entry.token.entity_id) : undefined) ??
              null,
          },
        }))
        setSnapshot((previous) =>
          current() && previous.input === input && previous.sceneId === sceneId && previous.enabled
            ? { ...previous, entries: enriched }
            : previous
        )
      } catch {
        // Keep the last readable queue. The next event or reconnect retries the read.
      } finally {
        running = false
        if (queued) schedule()
      }
    }
    const tokenChanged = (record: Partial<Token>) => {
      if (!active || (record.scene_id && record.scene_id !== sceneId)) return
      if (!record.id) return invalidate()
      const token = latest.current.entries.find((entry) => entry.token_id === record.id)?.token
      if (!token) return
      const present = displayFields.filter((key) => key in record)
      if (
        !present.length ||
        present.some((key) =>
          key === 'conditions'
            ? JSON.stringify(record[key]) !== JSON.stringify(token[key])
            : record[key] !== token[key]
        )
      )
        invalidate()
    }
    const channel = supabase
      .channel('initiative:' + sceneId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative',
          filter: 'scene_id=eq.' + sceneId,
        },
        invalidate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tokens',
          filter: 'scene_id=eq.' + sceneId,
        },
        (payload) => tokenChanged(payload.new as Partial<Token>)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') invalidate()
      })
    return () => {
      active = false
      generation++
      queued = false
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [sceneId, enabled])

  return snapshot.sceneId === sceneId && snapshot.input === initialInitiative
    ? snapshot.entries
    : initialInitiative
}
