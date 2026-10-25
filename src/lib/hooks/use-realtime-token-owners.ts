'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TokenOwnerWithProfile } from '@/lib/types'

interface Options {
  campaignId: string
  initialOwners: TokenOwnerWithProfile[]
}

export function useRealtimeTokenOwners({ campaignId, initialOwners }: Options) {
  const [owners, setOwners] = useState<TokenOwnerWithProfile[]>(() => initialOwners)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`token-owners:${campaignId}`)
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const rec = payload.payload?.record as TokenOwnerWithProfile | undefined
        if (!rec || rec.campaign_id !== campaignId) return
        setOwners((prev) => {
          if (prev.some((o) => o.token_id === rec.token_id && o.user_id === rec.user_id))
            return prev
          return [...prev, rec]
        })
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        const rec = payload.payload?.old_record as
          { token_id?: string; user_id?: string } | undefined
        if (!rec?.token_id || !rec?.user_id) return
        setOwners((prev) =>
          prev.filter((o) => !(o.token_id === rec.token_id && o.user_id === rec.user_id))
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId])

  return { owners, setOwners }
}
