'use client'

import { Plus, Package, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  canEdit: boolean
  onAddToCharacter: () => void
  onView: () => void
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-emerald-400',
  rare: 'text-sky-400',
  'very rare': 'text-violet-400',
  legendary: 'text-amber-400',
  artifact: 'text-red-400',
}

export default function SrdItemCard({
  item,
  canEdit,
  onAddToCharacter,
  onView,
}: Props) {
  const data = item.data
  const rarity = (data.rarity ?? 'common').toLowerCase()
  const rarityColor = RARITY_COLORS[rarity] ?? 'text-slate-400'

  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {item.name_ru ?? item.name}
          </h3>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Package size={10} />
            {data.item_type && (
              <span className="capitalize truncate">{data.item_type}</span>
            )}
            {data.attunement && (
              <span className="text-violet-400">· настройка</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs mb-3">
        <span className={cn('capitalize font-medium', rarityColor)}>
          {rarity}
        </span>
        {data.cost && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-amber-300">{data.cost}</span>
          </>
        )}
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
            onClick={onAddToCharacter}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            title="Добавить персонажу"
          >
            <Plus size={12} />
            <span className="hidden sm:inline">Добавить</span>
          </button>
        )}
      </div>
    </div>
  )
}