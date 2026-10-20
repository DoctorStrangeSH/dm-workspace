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
  'aberration', 'beast', 'celestial', 'construct', 'dragon',
  'elemental', 'fey', 'fiend', 'giant', 'humanoid',
  'monstrosity', 'ooze', 'plant', 'undead',
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
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
            className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded transition"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg border transition',
            showFilters || selectedCRs.length > 0 || selectedTypes.length > 0
              ? 'bg-indigo-950/60 border-indigo-600 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Фильтры</span>
          {(selectedCRs.length + selectedTypes.length) > 0 && (
            <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5">
              {selectedCRs.length + selectedTypes.length}
            </span>
          )}
        </button>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <div className="mt-3 space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              CR
            </div>
            <div className="flex flex-wrap gap-1">
              {availableCRs.slice(0, 30).map((cr) => (
                <button
                  key={cr}
                  onClick={() => toggleCR(cr)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition',
                    selectedCRs.includes(cr)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  )}
                >
                  {cr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Тип
            </div>
            <div className="flex flex-wrap gap-1">
              {MONSTER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition capitalize',
                    selectedTypes.includes(type)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
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
              className="text-xs text-slate-500 hover:text-white transition"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </div>
  )
}