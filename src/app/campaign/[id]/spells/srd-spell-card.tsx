'use client'

import { Plus, BookOpen } from 'lucide-react'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  canAdd: boolean
  onAdd: () => void
  onView: () => void
}

const SCHOOL_COLORS: Record<string, string> = {
  evocation: 'text-red-400',
  abjuration: 'text-sky-400',
  conjuration: 'text-violet-400',
  divination: 'text-emerald-400',
  enchantment: 'text-pink-400',
  illusion: 'text-purple-400',
  necromancy: 'text-gray-400',
  transmutation: 'text-amber-400',
}

export default function SrdSpellCard({
  spell,
  canAdd,
  onAdd,
  onView,
}: Props) {
  const parsed = parseSpellForDisplay(spell.data)
  const schoolKey = parsed.school.toLowerCase()
  const schoolColor = SCHOOL_COLORS[schoolKey] ?? 'text-slate-400'

  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {spell.name_ru ?? spell.name ?? parsed.name}
          </h3>
          <div className="text-xs text-slate-500 mt-0.5">
            <span className={schoolColor + ' capitalize'}>
              {parsed.school}
            </span>
            {' · '}
            <span>
              {parsed.level === 0 ? 'Заговор' : `${parsed.level} ур.`}
            </span>
            {parsed.ritual && ' · Ритуал'}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-3 space-y-0.5">
        <div>Время: {parsed.castingTime || '—'}</div>
        <div>Дистанция: {parsed.range || '—'}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
        >
          <BookOpen size={12} />
          Подробнее
        </button>
        {canAdd && (
          <button
            onClick={onAdd}
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