'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Handout } from '@/lib/types'
import { parseVisibleHandout, parseDeletedHandoutId } from '@/lib/realtime/visible-handout'
import type { VisibleHandout } from '@/lib/realtime/visible-handout'

interface Options {
  campaignId: string
  initialHandouts: Handout[]
  enabled?: boolean
}

export function useRealtimeHandouts({ campaignId, initialHandouts, enabled = true }: Options) {
  const [handouts, setHandouts] = useState<VisibleHandout[]>(initialHandouts)

  // Synchronize refreshed server-side props without a props-to-state effect.
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
        .channel(`handouts-visible:${campaignId}`, { config: { private: true } })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          if (cancelled) return
          const record = parseVisibleHandout(payload.payload?.record, campaignId)
          if (!record) return
          setHandouts((prev) => {
            if (prev.some((h) => h.id === record.id)) return prev
            return [record, ...prev]
          })
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          if (cancelled) return
          const record = parseVisibleHandout(payload.payload?.record, campaignId)
          if (!record) return
          setHandouts((prev) =>
            prev.map((handout) => handout.id === record.id ? { ...handout, ...record } : handout)
          )
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          if (cancelled) return
          const id = parseDeletedHandoutId(payload.payload?.old_record)
          if (!id) return
          setHandouts((prev) => prev.filter((handout) => handout.id !== id))
        })
        .subscribe()
    }

    void setup()

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [campaignId, enabled])

  const activeHandout = handouts.find((handout) => handout.is_visible) ?? null
  return { handouts, activeHandout }
}
