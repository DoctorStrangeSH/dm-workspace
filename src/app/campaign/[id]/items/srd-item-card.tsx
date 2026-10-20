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

export default function SrdItemCard({ item, canEdit, onAddToCharacter, onView }: Props) {
  const data = item.data
  const rarity = (data.rarity ?? 'common').toLowerCase()
  const rarityColor = RARITY_COLORS[rarity] ?? 'text-slate-400'

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{item.name_ru ?? item.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <Package size={10} />
            {data.item_type && <span className="truncate capitalize">{data.item_type}</span>}
            {data.attunement && <span className="text-violet-400">· настройка</span>}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={cn('font-medium capitalize', rarityColor)}>{rarity}</span>
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
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700"
        >
          <BookOpen size={12} />
          Подробнее
        </button>
        {canEdit && (
          <button
            onClick={onAddToCharacter}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white transition hover:bg-indigo-500"
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
