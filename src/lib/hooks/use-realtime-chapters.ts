'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Chapter } from '@/lib/types'

interface Options {
  campaignId: string
  initialChapters: Chapter[]
  enabled?: boolean
}

export function useRealtimeChapters({
  campaignId,
  initialChapters,
  enabled = true,
}: Options) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)

  // CHANGES: убран useEffect(setChapters) → официальный паттерн React
  // «adjusting state when props change» (сравнение в рендере через prevInitial).
  const [prevInitial, setPrevInitial] = useState(initialChapters)
  if (initialChapters !== prevInitial) {
    setPrevInitial(initialChapters)
    setChapters(initialChapters)
  }

  const sortChapters = useCallback(
    (list: Chapter[]) =>
      [...list].sort((a, b) => a.order_index - b.order_index),
    []
  )

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const channel = supabase
      .channel(`chapters:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chapters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const newChapter = payload.new as Chapter
          setChapters((prev) => {
            if (prev.some((c) => c.id === newChapter.id)) return prev
            return sortChapters([...prev, newChapter])
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chapters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const updated = payload.new as Chapter
          setChapters((prev) =>
            sortChapters(
              prev.map((c) => (c.id === updated.id ? updated : c))
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chapters',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setChapters((prev) => prev.filter((c) => c.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, enabled, sortChapters])

  return chapters
}