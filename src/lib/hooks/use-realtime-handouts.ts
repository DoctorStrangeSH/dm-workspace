'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Handout } from '@/lib/types'

// The Broadcast trigger intentionally omits image_url and created_at.
// Never treat this player-safe DTO as a full database handout.
type VisibleHandout = Pick<Handout, 'id' | 'campaign_id' | 'name' | 'is_visible'>

interface Options {
  campaignId: string
  initialHandouts: Handout[]
  enabled?: boolean
}

function parseVisibleHandout(value: unknown, campaignId: string): VisibleHandout | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    record.campaign_id !== campaignId ||
    typeof record.name !== 'string' ||
    record.is_visible !== true
  ) return null
  return {
    id: record.id,
    campaign_id: campaignId,
    name: record.name,
    is_visible: true,
  }
}

function parseDeletedHandoutId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const id = (value as Record<string, unknown>).id
  return typeof id === 'string' ? id : null
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
