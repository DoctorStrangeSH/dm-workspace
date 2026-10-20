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
    const next = levels.includes(lvl) ? levels.filter((l) => l !== lvl) : [...levels, lvl]
    setLevels(next)
    onFilterLevel(next)
  }

  const toggleSchool = (s: string) => {
    const next = schools.includes(s) ? schools.filter((x) => x !== s) : [...schools, s]
    setSchools(next)
    onFilterSchool(next)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder="Поиск заклинаний..."
            disabled={isPending}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pr-9 pl-9 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 hover:bg-slate-800"
            >
              <X size={14} className="text-slate-500" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2.5 transition',
            showFilters || levels.length > 0 || schools.length > 0
              ? 'border-indigo-600 bg-indigo-950/60 text-indigo-300'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Фильтры</span>
          {levels.length + schools.length > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 text-xs text-white">
              {levels.length + schools.length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
          <div>
            <div className="mb-2 text-xs tracking-wider text-slate-500 uppercase">Уровень</div>
            <div className="flex flex-wrap gap-1">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => toggleLevel(lvl)}
                  className={cn(
                    'min-w-[32px] rounded border px-2 py-1 text-xs transition',
                    levels.includes(lvl)
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  )}
                >
                  {lvl === 0 ? 'C' : lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs tracking-wider text-slate-500 uppercase">Школа</div>
            <div className="flex flex-wrap gap-1">
              {SCHOOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSchool(s)}
                  className={cn(
                    'rounded border px-2 py-1 text-xs capitalize transition',
                    schools.includes(s)
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
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
              className="text-xs text-slate-500 transition hover:text-white"
            >
              Сбросить
            </button>
          )}
        </div>
      )}
    </div>
  )
}
