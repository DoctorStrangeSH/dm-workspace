'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { srdItemTypeLabel } from '@/lib/srd/item-display'

interface Props {
  query: string
  types: string[]
  rarities: string[]
  onSearch: (q: string) => void
  onFilterType: (types: string[]) => void
  onFilterRarity: (rarities: string[]) => void
  availableTypes: string[]
  availableRarities: string[]
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
  query,
  types,
  rarities,
  onSearch,
  onFilterType,
  onFilterRarity,
  availableTypes,
  availableRarities,
}: Props) {
  const { t, lang } = useI18n()
  const [showFilters, setShowFilters] = useState(false)

  const toggleType = (type: string) => {
    const next = types.includes(type) ? types.filter((x) => x !== type) : [...types, type]
    onFilterType(next)
  }

  const toggleRarity = (r: string) => {
    const next = rarities.includes(r) ? rarities.filter((x) => x !== r) : [...rarities, r]
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
              onSearch(e.target.value)
            }}
            placeholder={t('items.searchPlaceholder')}
            aria-label={t('items.searchPlaceholder')}
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
          type="button"
          aria-label={t('items.filters')}
          aria-expanded={showFilters}
          aria-controls="item-catalog-filters"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 transition',
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
        <div
          id="item-catalog-filters"
          className="mt-3 space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
        >
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
                      aria-pressed={isActive}
                      onClick={() => toggleRarity(r)}
                      className={cn(
                        'min-h-11 rounded border px-3 py-2 text-xs transition',
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
                    aria-pressed={types.includes(type)}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'min-h-11 rounded border px-3 py-2 text-xs transition',
                      types.includes(type)
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    {srdItemTypeLabel(type, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtersCount > 0 && (
            <button
              onClick={() => {
                onFilterType([])
                onFilterRarity([])
              }}
              className="min-h-11 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              {t('items.resetFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
