'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Token } from '@/lib/types'

interface Options {
  sceneId: string
  initialTokens: Token[]
  enabled?: boolean
}

export function useRealtimeTokens({ sceneId, initialTokens, enabled = true }: Options) {
  const [tokens, setTokens] = useState<Token[]>(initialTokens)
  const [isReady, setIsReady] = useState(false)
  const changeVersion = useRef(0)

  const [prevInitial, setPrevInitial] = useState(initialTokens)
  if (initialTokens !== prevInitial) {
    setPrevInitial(initialTokens)
    setTokens(initialTokens)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    let cancelled = false
    const reconcile = async () => {
      const version = changeVersion.current
      const { data, error } = await supabase.from('tokens').select('*').eq('scene_id', sceneId)
      if (cancelled || error || !data || version !== changeVersion.current) return
      setTokens(data as Token[])
    }

    const setup = async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return

      // CHANGES: канал `tokens:<sceneId>` — совпадает с триггером broadcast_token_changes.
      const channel = supabase.channel(`tokens:${sceneId}`, {
        config: { private: true },
      })

      channel
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          const newToken = payload.payload.record as Token
          if (!newToken || newToken.scene_id !== sceneId) return
          changeVersion.current++
          setTokens((prev) => {
            if (prev.some((t) => t.id === newToken.id)) return prev
            return [...prev, newToken]
          })
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          const updated = payload.payload.record as Token
          if (!updated || updated.scene_id !== sceneId) return
          changeVersion.current++
          setTokens((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          const old = payload.payload.old_record as { id: string; scene_id?: string }
          if (!old || (old.scene_id && old.scene_id !== sceneId)) return
          changeVersion.current++
          setTokens((prev) => prev.filter((t) => t.id !== old.id))
        })
        .subscribe((status, err) => {
          if (cancelled) return
          setIsReady(status === 'SUBSCRIBED')
          if (status === 'SUBSCRIBED') void reconcile()
          if (err) console.warn('[tokens realtime] connection:', status, err.message)
        })

      return channel
    }

    let channel: Awaited<ReturnType<typeof setup>> | null = null
    setup().then((c) => {
      if (cancelled) {
        if (c) supabase.removeChannel(c)
      } else {
        channel = c
      }
    })

    return () => {
      cancelled = true
      changeVersion.current++
      setIsReady(false)
      if (channel) supabase.removeChannel(channel)
    }
  }, [sceneId, enabled])

  const updateLocal = useCallback((tokenId: string, updates: Partial<Token>) => {
    changeVersion.current++
    setTokens((prev) => prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)))
  }, [])

  return { tokens, updateLocal, isReady }
}
