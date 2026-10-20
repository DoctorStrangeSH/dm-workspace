'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MessageWithAuthor } from '@/lib/types'

interface Options {
  campaignId: string
  initialMessages: MessageWithAuthor[]
  enabled?: boolean
}

export function useRealtimeMessages({ campaignId, initialMessages, enabled = true }: Options) {
  const [messages, setMessages] = useState<MessageWithAuthor[]>(initialMessages)

  // CHANGES: убран useEffect(setMessages) → паттерн «props → state».
  const [prevInitial, setPrevInitial] = useState(initialMessages)
  if (initialMessages !== prevInitial) {
    setPrevInitial(initialMessages)
    setMessages(initialMessages)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    console.log('[messages realtime] creating channel for campaign:', campaignId)

    const channel = supabase
      .channel(`messages:${campaignId}`, {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, async (payload) => {
        console.log('[messages broadcast] INSERT:', payload)
        const newMsg = payload.payload.record as {
          id: string
          user_id: string
          [key: string]: unknown
        }
        if (!newMsg) return

        const { data: author } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', newMsg.user_id)
          .single()

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, author } as MessageWithAuthor]
        })
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        const updated = payload.payload.record as MessageWithAuthor
        if (!updated) return
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        const old = payload.payload.old_record as { id: string }
        if (!old) return
        setMessages((prev) => prev.filter((m) => m.id !== old.id))
      })
      .subscribe((status, err) => {
        console.log('[messages realtime] status:', status, 'err:', err)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, enabled])

  return messages
}
