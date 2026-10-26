'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InitiativeEntryWithToken } from '@/lib/types'

interface Options {
  sceneId: string
  initialInitiative: InitiativeEntryWithToken[]
  enabled?: boolean
}

export function useRealtimeInitiative({ sceneId, initialInitiative, enabled = true }: Options) {
  const [initiative, setInitiative] = useState<InitiativeEntryWithToken[]>(initialInitiative)
  const requestVersion = useRef(0)

  const [prevInitial, setPrevInitial] = useState(initialInitiative)
  if (initialInitiative !== prevInitial) {
    setPrevInitial(initialInitiative)
    setInitiative(initialInitiative)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    let active = true

    const refresh = async () => {
      const version = ++requestVersion.current
      // 1. Инициатива + token
      const { data } = await supabase
        .from('initiative')
        .select(
          `
          *,
          token:tokens (*)
        `
        )
        .eq('scene_id', sceneId)
        .order('turn_order')

      if (!active || version !== requestVersion.current || !data) return

      const entries = data.flatMap((row) => {
        const token = Array.isArray(row.token) ? row.token[0] : row.token
        return token ? [{ ...row, token } as InitiativeEntryWithToken] : []
      })

      // CHANGES: подтягиваем AC
      const characterIds = entries
        .map((e) => e.token.character_id)
        .filter((id): id is string => !!id)
      const entityIds = entries.map((e) => e.token.entity_id).filter((id): id is string => !!id)

      const [charsRes, entitiesRes] = await Promise.all([
        characterIds.length > 0
          ? supabase.from('characters').select('id, data_json').in('id', characterIds)
          : Promise.resolve({ data: [] as { id: string; data_json: unknown }[] }),
        entityIds.length > 0
          ? supabase.from('entities').select('id, data_json').in('id', entityIds)
          : Promise.resolve({ data: [] as { id: string; data_json: unknown }[] }),
      ])

      const acByCharacterId = new Map<string, number>()
      for (const row of charsRes.data ?? []) {
        const dj = row.data_json as { ac?: number } | null
        if (typeof dj?.ac === 'number') acByCharacterId.set(row.id, dj.ac)
      }
      const acByEntityId = new Map<string, number>()
      for (const row of entitiesRes.data ?? []) {
        const dj = row.data_json as { ac?: number } | null
        if (typeof dj?.ac === 'number') acByEntityId.set(row.id, dj.ac)
      }

      if (!active || version !== requestVersion.current) return

      setInitiative(
        entries.map((entry) => ({
          ...entry,
          token: {
            ...entry.token,
            ac:
              (entry.token.character_id
                ? acByCharacterId.get(entry.token.character_id)
                : undefined) ??
              (entry.token.entity_id ? acByEntityId.get(entry.token.entity_id) : undefined) ??
              null,
          },
        })) as InitiativeEntryWithToken[]
      )
    }

    const channel = supabase
      .channel(`initiative:${sceneId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative',
          filter: `scene_id=eq.${sceneId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tokens',
          filter: `scene_id=eq.${sceneId}`,
        },
        refresh
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void refresh()
      })

    return () => {
      active = false
      requestVersion.current++
      void supabase.removeChannel(channel)
    }
  }, [sceneId, enabled])

  return initiative
}
