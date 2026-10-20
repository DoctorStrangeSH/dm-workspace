'use client'

import { Plus, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  monster: SrdMonster
  canEdit: boolean
  onAdd: () => void
  onView: () => void
}

const TYPE_COLORS: Record<string, string> = {
  dragon: 'text-red-400',
  undead: 'text-violet-400',
  fiend: 'text-red-500',
  celestial: 'text-yellow-300',
  fey: 'text-pink-400',
  beast: 'text-emerald-400',
  humanoid: 'text-sky-400',
  giant: 'text-amber-400',
  construct: 'text-slate-400',
  elemental: 'text-cyan-400',
  aberration: 'text-purple-400',
  monstrosity: 'text-orange-400',
  ooze: 'text-green-500',
  plant: 'text-lime-400',
}

export default function MonsterCard({ monster, canEdit, onAdd, onView }: Props) {
  const data = monster.data
  const type = (data.type ?? '').toLowerCase()
  const typeColor = TYPE_COLORS[type] ?? 'text-slate-400'
  const cr = data.cr ?? '—' // ← ИСПРАВЛЕНО: cr, не challenge_rating
  const hp = data.hp ?? data.hp_max ?? '?'
  const ac = data.ac ?? '?'

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{monster.name_ru ?? monster.name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className={cn('capitalize', typeColor)}>{type}</span>
            {data.size && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500 capitalize">{data.size}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs tracking-wider text-slate-500 uppercase">CR</div>
          <div className="text-lg font-bold text-amber-400">{cr}</div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <span>HP: {hp}</span>
        <span className="text-slate-600">·</span>
        <span>AC: {ac}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700"
        >
          <BookOpen size={12} />
          Подробнее
        </button>
        {canEdit && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white transition hover:bg-indigo-500"
            title="Добавить в кампанию"
          >
            <Plus size={12} />
            <span className="hidden sm:inline">Добавить</span>
          </button>
        )}
      </div>
    </div>
  )
}
