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

export default function MonsterCard({
  monster,
  canEdit,
  onAdd,
  onView,
}: Props) {
  const data = monster.data
  const type = (data.type ?? '').toLowerCase()
  const typeColor = TYPE_COLORS[type] ?? 'text-slate-400'
  const cr = data.cr ?? '—'  // ← ИСПРАВЛЕНО: cr, не challenge_rating
  const hp = data.hp ?? data.hp_max ?? '?'
  const ac = data.ac ?? '?'

  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {monster.name_ru ?? monster.name}
          </h3>
          <div className="flex items-center gap-2 text-xs mt-0.5">
            <span className={cn('capitalize', typeColor)}>{type}</span>
            {data.size && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500 capitalize">{data.size}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            CR
          </div>
          <div className="text-lg font-bold text-amber-400">{cr}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <span>HP: {hp}</span>
        <span className="text-slate-600">·</span>
        <span>AC: {ac}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
        >
          <BookOpen size={12} />
          Подробнее
        </button>
        {canEdit && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
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