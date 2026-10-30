'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface Props {
  query: string
  levels: number[]
  schools: string[]
  onSearch: (q: string) => void
  onFilterLevel: (levels: number[]) => void
  onFilterSchool: (schools: string[]) => void
}

const SCHOOLS = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
]

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SpellsSearch({
  query,
  levels,
  schools,
  onSearch,
  onFilterLevel,
  onFilterSchool,
}: Props) {
  const t = useT()
  const [showFilters, setShowFilters] = useState(false)

  const toggleLevel = (lvl: number) => {
    const next = levels.includes(lvl) ? levels.filter((l) => l !== lvl) : [...levels, lvl]
    onFilterLevel(next)
  }

  const toggleSchool = (s: string) => {
    const next = schools.includes(s) ? schools.filter((x) => x !== s) : [...schools, s]
    onFilterSchool(next)
  }

  const filtersCount = levels.length + schools.length

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-subtle)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              onSearch(e.target.value)
            }}
            placeholder={t('spells.searchPlaceholder')}
            aria-label={t('spells.searchPlaceholder')}
            className="min-h-12 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pr-12 pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                onSearch('')
              }}
              className="absolute top-1/2 right-0 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded hover:bg-[var(--bg-hover)]"
              aria-label={t('common.clear')}
            >
              <X size={14} className="text-[var(--text-subtle)]" />
            </button>
          )}
        </div>

        <button
          aria-controls="spell-catalog-filters"
          type="button"
          aria-label={t('spells.filters')}
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 transition',
            showFilters || filtersCount > 0
              ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
              : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">{t('spells.filters')}</span>
          {filtersCount > 0 && (
            <span className="rounded-full bg-[var(--accent)] px-1.5 text-xs text-white">
              {filtersCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          id="spell-catalog-filters"
          className="mt-3 space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
        >
          <div>
            <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
              {t('spells.filter.level')}
            </div>
            <div className="flex flex-wrap gap-1">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  aria-pressed={levels.includes(lvl)}
                  onClick={() => toggleLevel(lvl)}
                  className={cn(
                    'min-h-11 min-w-11 rounded border px-3 py-2 text-xs transition',
                    levels.includes(lvl)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  )}
                >
                  {lvl === 0 ? t('spells.cantrip') : lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
              {t('spells.filter.school')}
            </div>
            <div className="flex flex-wrap gap-1">
              {SCHOOLS.map((s) => (
                <button
                  key={s}
                  aria-pressed={schools.includes(s)}
                  onClick={() => toggleSchool(s)}
                  className={cn(
                    'min-h-11 min-w-11 rounded border px-3 py-2 text-xs transition',
                    schools.includes(s)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  )}
                >
                  {t(`school.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {filtersCount > 0 && (
            <button
              onClick={() => {
                onFilterLevel([])
                onFilterSchool([])
              }}
              className="min-h-11 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              {t('spells.resetFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
