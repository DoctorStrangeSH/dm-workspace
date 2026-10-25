'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface Props {
  onSearch: (q: string) => void
  onFilterType: (types: string[]) => void
  onFilterRarity: (rarities: string[]) => void
  availableTypes: string[]
  availableRarities: string[]
  isPending?: boolean
}

// CHANGES: хардкод цветов → семантические токены
const RARITY_COLORS: Record<string, string> = {
  common: 'text-[var(--text-muted)]',
  uncommon: 'text-[var(--success-text)]',
  rare: 'text-[var(--info-text)]',
  'very rare': 'text-[var(--accent-text)]',
  legendary: 'text-[var(--warning-text)]',
  artifact: 'text-[var(--danger-text)]',
  varies: 'text-[var(--text-muted)]',
}

/** 'very rare' → 'veryRare' (для i18n-ключа) */
function rarityI18nKey(raw: string): string {
  return raw.replace(/\s+([a-z])/g, (_, c: string) => c.toUpperCase())
}

export default function ItemsSearch({
  onSearch,
  onFilterType,
  onFilterRarity,
  availableTypes,
  availableRarities,
  isPending,
}: Props) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleType = (type: string) => {
    const next = types.includes(type) ? types.filter((x) => x !== type) : [...types, type]
    setTypes(next)
    onFilterType(next)
  }

  const toggleRarity = (r: string) => {
    const next = rarities.includes(r) ? rarities.filter((x) => x !== r) : [...rarities, r]
    setRarities(next)
    onFilterRarity(next)
  }

  const filtersCount = types.length + rarities.length

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
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder={t('items.searchPlaceholder')}
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pr-9 pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 hover:bg-[var(--bg-hover)]"
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
          <span className="hidden sm:inline">{t('items.filters')}</span>
          {filtersCount > 0 && (
            <span className="rounded-full bg-[var(--accent)] px-1.5 text-xs text-white">
              {filtersCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          {availableRarities.length > 0 && (
            <div>
              <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
                {t('items.filter.rarity')}
              </div>
              <div className="flex flex-wrap gap-1">
                {availableRarities.map((r) => {
                  const isActive = rarities.includes(r)
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRarity(r)}
                      className={cn(
                        'rounded border px-2 py-1 text-xs transition',
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : cn(
                              'border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--border-hover)]',
                              RARITY_COLORS[r] ?? 'text-[var(--text-muted)]'
                            )
                      )}
                    >
                      {t(`itemRarity.${rarityI18nKey(r)}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {availableTypes.length > 0 && (
            <div>
              <div className="mb-2 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
                {t('items.filter.type')}
              </div>
              <div className="flex flex-wrap gap-1">
                {availableTypes.slice(0, 30).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'rounded border px-2 py-1 text-xs capitalize transition',
                      types.includes(type)
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtersCount > 0 && (
            <button
              onClick={() => {
                setTypes([])
                setRarities([])
                onFilterType([])
                onFilterRarity([])
              }}
              className="text-xs text-[var(--text-subtle)] transition hover:text-[var(--text-primary)]"
            >
              {t('items.resetFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
