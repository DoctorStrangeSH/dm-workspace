'use client'

import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

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
  const t = useT()

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
          placeholder={t('chapters.search.placeholder')}
          className="w-full min-h-11 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-3 pr-24 pl-10 text-sm text-[var(--text-primary)] transition placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden"
          aria-label={t('chapters.search.ariaLabel')}
        />

        {isSearching && (
          <div className="pointer-events-none absolute top-1/2 right-10 -translate-y-1/2 text-xs text-[var(--text-subtle)]">
            {t('chapters.search.matchedOf', { matched: matchedCount, total: totalCount })}
          </div>
        )}

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 transition hover:bg-[var(--bg-hover)]"
            aria-label={t('chapters.search.clear')}
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
