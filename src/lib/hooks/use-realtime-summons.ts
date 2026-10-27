'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SummonRequestWithRequester } from '@/lib/types'

interface Options {
  campaignId: string
  initialRequests: SummonRequestWithRequester[]
}

export function useRealtimeSummons({ campaignId, initialRequests }: Options) {
  // Lazy init — без setState в useEffect
  const [requests, setRequests] = useState<SummonRequestWithRequester[]>(() => initialRequests)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`summons:${campaignId}`, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const req = payload.payload?.record as SummonRequestWithRequester | undefined
        if (!req || req.campaign_id !== campaignId) return
        setRequests((prev) => {
          if (prev.some((r) => r.id === req.id)) return prev
          return [...prev, req]
        })
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        const req = payload.payload?.record as SummonRequestWithRequester | undefined
        if (!req || req.campaign_id !== campaignId) return
        setRequests((prev) => {
          if (req.status === 'pending') {
            if (prev.some((r) => r.id === req.id)) {
              return prev.map((r) => (r.id === req.id ? req : r))
            }
            return [...prev, req]
          }
          return prev.filter((r) => r.id !== req.id)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId])

  return { requests, setRequests }
}
