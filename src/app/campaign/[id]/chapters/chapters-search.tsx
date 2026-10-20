'use client'

import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  totalCount: number
  matchedCount: number
  isSearching: boolean
  className?: string
}

const ChaptersSearch = forwardRef<HTMLInputElement, Props>(function ChaptersSearch(
  { value, onChange, totalCount, matchedCount, isSearching, className },
  ref
) {
  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Поиск по главам и содержимому..."
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pr-24 pl-9 text-sm text-[var(--text-primary)] transition placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden"
          aria-label="Поиск глав"
        />

        {isSearching && (
          <div className="pointer-events-none absolute top-1/2 right-10 -translate-y-1/2 text-xs text-[var(--text-subtle)]">
            {matchedCount} из {totalCount}
          </div>
        )}

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 transition hover:bg-[var(--bg-hover)]"
            aria-label="Очистить поиск"
            type="button"
          >
            <X size={14} className="text-[var(--text-subtle)]" />
          </button>
        )}
      </div>
    </div>
  )
})

export default ChaptersSearch
