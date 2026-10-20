'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InitiativeEntryWithToken } from '@/lib/types'

interface Options {
  sceneId: string
  initialInitiative: InitiativeEntryWithToken[]
  enabled?: boolean
}

export function useRealtimeInitiative({
  sceneId,
  initialInitiative,
  enabled = true,
}: Options) {
  const [initiative, setInitiative] =
    useState<InitiativeEntryWithToken[]>(initialInitiative)

  // CHANGES: убран useEffect(setInitiative) → паттерн «props → state».
  const [prevInitial, setPrevInitial] = useState(initialInitiative)
  if (initialInitiative !== prevInitial) {
    setPrevInitial(initialInitiative)
    setInitiative(initialInitiative)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const refresh = async () => {
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

      if (data) {
        setInitiative(
          data.map((row) => {
            const token = Array.isArray(row.token) ? row.token[0] : row.token
            return { ...row, token } as InitiativeEntryWithToken
          })
        )
      }
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sceneId, enabled])

  return initiative
}