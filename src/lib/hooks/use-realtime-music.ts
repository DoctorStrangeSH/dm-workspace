'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MusicPlayerState } from '@/lib/types'

interface Options {
  campaignId: string
  initialState: MusicPlayerState | null
}

export function useRealtimeMusic({ campaignId, initialState }: Options) {
  const [state, setState] = useState<MusicPlayerState | null>(initialState)

  useEffect(() => {
    setState(initialState)
  }, [initialState])

  useEffect(() => {
    if (!campaignId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`music:${campaignId}`, {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const record = payload.payload.record as MusicPlayerState
        if (record) setState(record)
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        const record = payload.payload.record as MusicPlayerState
        if (record) setState(record)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId])

  return state
}