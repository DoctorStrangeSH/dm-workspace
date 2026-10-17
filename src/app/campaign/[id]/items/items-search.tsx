'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSearch: (q: string) => void
  onFilterType: (types: string[]) => void
  onFilterRarity: (rarities: string[]) => void
  availableTypes: string[]
  availableRarities: string[]
  isPending?: boolean
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  'very rare': 'Очень редкий',
  legendary: 'Легендарный',
  artifact: 'Артефакт',
  varies: 'Варьируется',
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-emerald-400',
  rare: 'text-sky-400',
  'very rare': 'text-violet-400',
  legendary: 'text-amber-400',
  artifact: 'text-red-400',
}

export default function ItemsSearch({
  onSearch,
  onFilterType,
  onFilterRarity,
  availableTypes,
  availableRarities,
  isPending,
}: Props) {
  const [query, setQuery] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleType = (t: string) => {
    const next = types.includes(t) ? types.filter((x) => x !== t) : [...types, t]
    setTypes(next)
    onFilterType(next)
  }

  const toggleRarity = (r: string) => {
    const next = rarities.includes(r)
      ? rarities.filter((x) => x !== r)
      : [...rarities, r]
    setRarities(next)
    onFilterRarity(next)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder="Поиск предметов..."
            disabled={isPending}
            className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg border transition',
            showFilters || types.length > 0 || rarities.length > 0
              ? 'bg-indigo-950/60 border-indigo-600 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Фильтры</span>
          {types.length + rarities.length > 0 && (
            <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5">
              {types.length + rarities.length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
          {availableRarities.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Редкость
              </div>
              <div className="flex flex-wrap gap-1">
                {availableRarities.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRarity(r)}
                    className={cn(
                      'px-2 py-1 text-xs rounded border transition',
                      rarities.includes(r)
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700',
                      !rarities.includes(r) && RARITY_COLORS[r]
                    )}
                  >
                    {RARITY_LABELS[r] ?? r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableTypes.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Тип
              </div>
              <div className="flex flex-wrap gap-1">
                {availableTypes.slice(0, 30).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={cn(
                      'px-2 py-1 text-xs rounded border transition capitalize',
                      types.includes(t)
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(types.length > 0 || rarities.length > 0) && (
            <button
              onClick={() => {
                setTypes([])
                setRarities([])
                onFilterType([])
                onFilterRarity([])
              }}
              className="text-xs text-slate-500 hover:text-white transition"
            >
              Сбросить
            </button>
          )}
        </div>
      )}
    </div>
  )
}