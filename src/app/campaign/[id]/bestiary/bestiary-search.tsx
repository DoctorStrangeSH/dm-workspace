'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(next)
    onFilterType(next)
  }

  return (
    <div className="mb-4">
      {/* Поиск */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder="Поиск монстров..."
            disabled={isPending}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pr-9 pl-9 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 transition hover:bg-slate-800"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2.5 transition',
            showFilters || selectedCRs.length > 0 || selectedTypes.length > 0
              ? 'border-indigo-600 bg-indigo-950/60 text-indigo-300'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Фильтры</span>
          {selectedCRs.length + selectedTypes.length > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 text-xs text-white">
              {selectedCRs.length + selectedTypes.length}
            </span>
          )}
        </button>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
          <div>
            <div className="mb-2 text-xs tracking-wider text-slate-500 uppercase">CR</div>
            <div className="flex flex-wrap gap-1">
              {availableCRs.slice(0, 30).map((cr) => (
                <button
                  key={cr}
                  onClick={() => toggleCR(cr)}
                  className={cn(
                    'rounded border px-2 py-1 text-xs transition',
                    selectedCRs.includes(cr)
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  )}
                >
                  {cr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs tracking-wider text-slate-500 uppercase">Тип</div>
            <div className="flex flex-wrap gap-1">
              {MONSTER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'rounded border px-2 py-1 text-xs capitalize transition',
                    selectedTypes.includes(type)
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {(selectedCRs.length > 0 || selectedTypes.length > 0) && (
            <button
              onClick={() => {
                setSelectedCRs([])
                setSelectedTypes([])
                onFilterCR([])
                onFilterType([])
              }}
              className="text-xs text-slate-500 transition hover:text-white"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </div>
  )
}
