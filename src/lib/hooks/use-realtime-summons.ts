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
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return

      channel = supabase
      .channel(`summons:${campaignId}`, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const record = payload.payload?.record as Omit<SummonRequestWithRequester, 'requester'> | undefined
        if (!record || record.campaign_id !== campaignId) return
        void supabase
          .from('profiles')
          .select('id, username, display_name')
          .eq('id', record.requester_id)
          .maybeSingle()
          .then(({ data: requester }) => {
            if (!requester || cancelled) return
            const req: SummonRequestWithRequester = { ...record, requester }
            setRequests((prev) => {
          if (prev.some((r) => r.id === req.id)) return prev
          return [...prev, req]
            })
          })
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        const record = payload.payload?.record as Omit<SummonRequestWithRequester, 'requester'> | undefined
        if (!record || record.campaign_id !== campaignId) return
        if (record.status !== 'pending') {
          setRequests((prev) => prev.filter((r) => r.id !== record.id))
          return
        }
        void supabase
          .from('profiles')
          .select('id, username, display_name')
          .eq('id', record.requester_id)
          .maybeSingle()
          .then(({ data: requester }) => {
            if (!requester || cancelled) return
            const req: SummonRequestWithRequester = { ...record, requester }
            setRequests((prev) => {
              if (prev.some((r) => r.id === req.id)) {
                return prev.map((r) => (r.id === req.id ? req : r))
              }
              return [...prev, req]
            })
          })
      })
      .subscribe()
    }

    void setup()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [campaignId])

  return { requests, setRequests }
}
