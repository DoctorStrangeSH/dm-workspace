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
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return

      channel = supabase
      .channel(`token-owners:${campaignId}`, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const record = payload.payload?.record as Omit<TokenOwnerWithProfile, 'profile'> | undefined
        if (!record || record.campaign_id !== campaignId) return
        void supabase
          .from('profiles')
          .select('id, username, display_name')
          .eq('id', record.user_id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (!profile || cancelled) return
            const rec: TokenOwnerWithProfile = { ...record, profile }
            setOwners((prev) => {
              if (prev.some((o) => o.token_id === rec.token_id && o.user_id === rec.user_id))
                return prev
              return [...prev, rec]
            })
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
    }

    void setup()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [campaignId])

  return { owners, setOwners }
}
