'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FogArea } from '@/lib/types'

interface Options {
  sceneId: string
  initialFog: FogArea[]
  enabled?: boolean
}

export function useRealtimeFog({ sceneId, initialFog, enabled = true }: Options) {
  const [fog, setFog] = useState<FogArea[]>(initialFog)

  // CHANGES: убран useEffect(setFog) → паттерн «props → state».
  const [prevInitial, setPrevInitial] = useState(initialFog)
  if (initialFog !== prevInitial) {
    setPrevInitial(initialFog)
    setFog(initialFog)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const channel = supabase
      .channel(`fog:${sceneId}`, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const newArea = payload.payload.record as FogArea
        if (!newArea || !newArea.is_revealed) return
        setFog((prev) => {
          if (prev.some((f) => f.id === newArea.id)) return prev
          return [...prev, newArea]
        })
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        const old = payload.payload.old_record as { id: string }
        if (!old) return
        setFog((prev) => prev.filter((f) => f.id !== old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sceneId, enabled])

  return fog
}
