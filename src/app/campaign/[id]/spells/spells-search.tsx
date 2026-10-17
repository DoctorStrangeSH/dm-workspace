'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSearch: (q: string) => void
  onFilterLevel: (levels: number[]) => void
  onFilterSchool: (schools: string[]) => void
  isPending?: boolean
}

const SCHOOLS = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation',
]

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SpellsSearch({
  onSearch,
  onFilterLevel,
  onFilterSchool,
  isPending,
}: Props) {
  const [query, setQuery] = useState('')
  const [levels, setLevels] = useState<number[]>([])
  const [schools, setSchools] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleLevel = (lvl: number) => {
    const next = levels.includes(lvl)
      ? levels.filter((l) => l !== lvl)
      : [...levels, lvl]
    setLevels(next)
    onFilterLevel(next)
  }

  const toggleSchool = (s: string) => {
    const next = schools.includes(s)
      ? schools.filter((x) => x !== s)
      : [...schools, s]
    setSchools(next)
    onFilterSchool(next)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder="Поиск заклинаний..."
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
            showFilters || levels.length > 0 || schools.length > 0
              ? 'bg-indigo-950/60 border-indigo-600 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Фильтры</span>
          {levels.length + schools.length > 0 && (
            <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5">
              {levels.length + schools.length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Уровень
            </div>
            <div className="flex flex-wrap gap-1">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => toggleLevel(lvl)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition min-w-[32px]',
                    levels.includes(lvl)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  )}
                >
                  {lvl === 0 ? 'C' : lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Школа
            </div>
            <div className="flex flex-wrap gap-1">
              {SCHOOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSchool(s)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition capitalize',
                    schools.includes(s)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {(levels.length > 0 || schools.length > 0) && (
            <button
              onClick={() => {
                setLevels([])
                setSchools([])
                onFilterLevel([])
                onFilterSchool([])
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