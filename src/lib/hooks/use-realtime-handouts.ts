'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Handout } from '@/lib/types'

interface Options {
  campaignId: string
  initialHandouts: Handout[]
  enabled?: boolean
}

export function useRealtimeHandouts({ campaignId, initialHandouts, enabled = true }: Options) {
  const [handouts, setHandouts] = useState<Handout[]>(initialHandouts)

  // CHANGES: убран useEffect(setHandouts) → паттерн «props → state».
  const [prevInitial, setPrevInitial] = useState(initialHandouts)
  if (initialHandouts !== prevInitial) {
    setPrevInitial(initialHandouts)
    setHandouts(initialHandouts)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return

      channel = supabase
      .channel(`handouts:${campaignId}`, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const record = payload.payload.record as Handout
        if (!record) return
        setHandouts((prev) => {
          if (prev.some((h) => h.id === record.id)) return prev
          return [record, ...prev]
        })
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        const record = payload.payload.record as Handout
        if (!record) return
        setHandouts((prev) => prev.map((h) => (h.id === record.id ? record : h)))
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        const old = payload.payload.old_record as { id: string }
        if (!old) return
        setHandouts((prev) => prev.filter((h) => h.id !== old.id))
      })
      .subscribe()

    }

    void setup()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [campaignId, enabled])

  const activeHandout = handouts.find((h) => h.is_visible) ?? null

  return { handouts, activeHandout }
}
