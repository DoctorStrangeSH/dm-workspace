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

const ChaptersSearch = forwardRef<HTMLInputElement, Props>(
  function ChaptersSearch(
    {
      value,
      onChange,
      totalCount,
      matchedCount,
      isSearching,
      className,
    },
    ref
  ) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Поиск по главам и содержимому..."
            className="w-full pl-9 pr-24 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
            aria-label="Поиск глав"
          />

          {/* Счётчик — слева от крестика */}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
              {matchedCount} из {totalCount}
            </div>
          )}

          {/* Кнопка очистки */}
          {value && (
            <button
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded transition"
              aria-label="Очистить поиск"
              type="button"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>
    )
  }
)

export default ChaptersSearch