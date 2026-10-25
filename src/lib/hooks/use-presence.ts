'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface OnlineUser {
  user_id: string
  display_name: string
  username: string
  online_at: string
}

interface Options {
  campaignId: string
  currentUserId: string
  currentUserName: string
  enabled?: boolean
}

export function usePresence({
  campaignId,
  currentUserId,
  currentUserName,
  enabled = true,
}: Options) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (!enabled || !currentUserId) return

    const supabase = createClient()
    const channelName = `presence:${campaignId}`

    const channel = supabase.channel(channelName, {
      config: { presence: { key: currentUserId } },
    })

    const track = async () => {
      await channel.track({
        user_id: currentUserId,
        display_name: currentUserName,
        username: currentUserName,
        online_at: new Date().toISOString(),
      })
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: OnlineUser[] = []
        for (const key in state) {
          const presences = state[key] as unknown as OnlineUser[]
          if (presences[0]) users.push(presences[0])
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await track()
        }
      })

    // CHANGES (задача 4): re-track при возврате на вкладку (mobile/tab freeze).
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        track().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      supabase.removeChannel(channel)
    }
  }, [campaignId, currentUserId, currentUserName, enabled])

  return onlineUsers
}
