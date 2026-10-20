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

export default function SrdSpellCard({ spell, canAdd, onAdd, onView }: Props) {
  const parsed = parseSpellForDisplay(spell.data)
  const schoolKey = parsed.school.toLowerCase()
  const schoolColor = SCHOOL_COLORS[schoolKey] ?? 'text-slate-400'

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{spell.name_ru ?? spell.name ?? parsed.name}</h3>
          <div className="mt-0.5 text-xs text-slate-500">
            <span className={schoolColor + ' capitalize'}>{parsed.school}</span>
            {' · '}
            <span>{parsed.level === 0 ? 'Заговор' : `${parsed.level} ур.`}</span>
            {parsed.ritual && ' · Ритуал'}
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-0.5 text-xs text-slate-500">
        <div>Время: {parsed.castingTime || '—'}</div>
        <div>Дистанция: {parsed.range || '—'}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700"
        >
          <BookOpen size={12} />
          Подробнее
        </button>
        {canAdd && (
          <button
            onClick={onAdd}
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
