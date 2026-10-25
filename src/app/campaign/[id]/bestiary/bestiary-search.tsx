'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface Props {
  onSearch: (query: string) => void
  onFilterCR: (crs: string[]) => void
  onFilterType: (types: string[]) => void
  availableCRs: string[]
  isPending?: boolean
}

const MONSTER_TYPES = [
  'aberration',
  'beast',
  'celestial',
  'construct',
  'dragon',
  'elemental',
  'fey',
  'fiend',
  'giant',
  'humanoid',
  'monstrosity',
  'ooze',
  'plant',
  'undead',
]

export default function BestiarySearch({
  onSearch,
  onFilterCR,
  onFilterType,
  availableCRs,
  isPending,
}: Props) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [selectedCRs, setSelectedCRs] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleCR = (cr: string) => {
    const next = selectedCRs.includes(cr)
      ? selectedCRs.filter((c) => c !== cr)
      : [...selectedCRs, cr]
    setSelectedCRs(next)
    onFilterCR(next)
  }

  const toggleType = (type: string) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((tp) => tp !== type)
      : [...selectedTypes, type]
    setSelectedTypes(next)
    onFilterType(next)
  }

  const filtersCount = selectedCRs.length + selectedTypes.length

  return (
    <div className="mb-4">
      {/* Поиск */}
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
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder={t('bestiary.searchPlaceholder')}
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pr-9 pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 transition hover:bg-[var(--bg-hover)]"
              aria-label={t('common.clear')}
            >
              <X size={14} className="text-[var(--text-subtle)]" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2.5 transition',
            showFilters || filtersCount > 0
              ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
              : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">{t('bestiary.filters')}</span>
          {filtersCount > 0 && (
            <span className="rounded-full bg-[var(--accent)] px-1.5 text-xs text-white">
              {filtersCount}
            </span>
          )}
        </button>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <div className="mt-3 space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          <div>
            <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
              {t('bestiary.filter.cr')}
            </div>
            <div className="flex flex-wrap gap-1">
              {availableCRs.slice(0, 30).map((cr) => (
                <button
                  key={cr}
                  onClick={() => toggleCR(cr)}
                  className={cn(
                    'rounded border px-2 py-1 text-xs transition',
                    selectedCRs.includes(cr)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  )}
                >
                  {cr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
              {t('bestiary.filter.type')}
            </div>
            <div className="flex flex-wrap gap-1">
              {MONSTER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'rounded border px-2 py-1 text-xs transition',
                    selectedTypes.includes(type)
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  )}
                >
                  {t(`monsterType.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {filtersCount > 0 && (
            <button
              onClick={() => {
                setSelectedCRs([])
                setSelectedTypes([])
                onFilterCR([])
                onFilterType([])
              }}
              className="text-xs text-[var(--text-subtle)] transition hover:text-[var(--text-primary)]"
            >
              {t('bestiary.resetFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
