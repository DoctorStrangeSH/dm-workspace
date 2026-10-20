'use client'

import { useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import type { Chapter } from '@/lib/types'

interface FilterResult {
  filtered: Chapter[]
  totalCount: number
  matchedCount: number
  isSearching: boolean
}

/**
 * Фильтрует главы по названию и содержимому.
 * Debounce 200мс — не фильтрует на каждое нажатие.
 */
export function useChapterFilter(chapters: Chapter[], query: string): FilterResult {
  const debouncedQuery = useDebouncedValue(query, 200)

  return useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase()

    if (!trimmed) {
      return {
        filtered: chapters,
        totalCount: chapters.length,
        matchedCount: chapters.length,
        isSearching: false,
      }
    }

    const matched = chapters.filter((c) => {
      const inTitle = c.title.toLowerCase().includes(trimmed)
      const inContent = c.content_md.toLowerCase().includes(trimmed)
      return inTitle || inContent
    })

    return {
      filtered: matched,
      totalCount: chapters.length,
      matchedCount: matched.length,
      isSearching: true,
    }
  }, [chapters, debouncedQuery])
}
