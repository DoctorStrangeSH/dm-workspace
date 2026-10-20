'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Token } from '@/lib/types'

interface Options {
  sceneId: string
  initialTokens: Token[]
  enabled?: boolean
}

export function useRealtimeTokens({ sceneId, initialTokens, enabled = true }: Options) {
  const [tokens, setTokens] = useState<Token[]>(initialTokens)

  // CHANGES:
  // 1. Убран useEffect с setTokens(initialTokens) — это вызывало каскадный рендер.
  // 2. Используется официальный паттерн React «adjusting state when props change»:
  //    сравнение в рендере через prevInitial + setState в рендере (React поддерживает это).
  //    https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // 3. setState в рендере срабатывает только когда initialTokens реально изменился (по ссылке).
  const [prevInitial, setPrevInitial] = useState(initialTokens)
  if (initialTokens !== prevInitial) {
    setPrevInitial(initialTokens)
    setTokens(initialTokens)
  }

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    console.log('[tokens realtime] creating channel for scene:', sceneId)

    const channel = supabase
      .channel(`tokens:${sceneId}`, {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        console.log('[tokens broadcast] INSERT:', payload)
        const newToken = payload.payload.record as Token
        if (!newToken) return
        setTokens((prev) => {
          if (prev.some((t) => t.id === newToken.id)) return prev
          return [...prev, newToken]
        })
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        console.log('[tokens broadcast] UPDATE:', payload)
        const updated = payload.payload.record as Token
        if (!updated) return
        setTokens((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        console.log('[tokens broadcast] DELETE:', payload)
        const old = payload.payload.old_record as { id: string }
        if (!old) return
        setTokens((prev) => prev.filter((t) => t.id !== old.id))
      })
      .subscribe((status, err) => {
        console.log('[tokens realtime] status:', status, 'err:', err)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sceneId, enabled])

  const updateLocal = useCallback((tokenId: string, updates: Partial<Token>) => {
    setTokens((prev) => prev.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)))
  }, [])

  return { tokens, updateLocal }
}
