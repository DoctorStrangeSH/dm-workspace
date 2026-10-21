'use client'

import { Plus, BookOpen } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  canAdd: boolean
  onAdd: () => void
  onView: () => void
}

const SCHOOL_COLORS: Record<string, string> = {
  evocation: 'text-[var(--danger)]',
  abjuration: 'text-[var(--info)]',
  conjuration: 'text-[var(--accent-text)]',
  divination: 'text-[var(--success)]',
  enchantment: 'text-pink-400',
  illusion: 'text-purple-400',
  necromancy: 'text-[var(--text-muted)]',
  transmutation: 'text-[var(--warning)]',
}

export default function SrdSpellCard({ spell, canAdd, onAdd, onView }: Props) {
  const parsed = parseSpellForDisplay(spell.data)
  const schoolKey = parsed.school.toLowerCase()
  const schoolColor = SCHOOL_COLORS[schoolKey] ?? 'text-[var(--text-muted)]'

  return (
    <Card padding="md" hoverable className="group flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">
            {spell.name_ru ?? spell.name ?? parsed.name}
          </h3>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            <span className={schoolColor + ' capitalize'}>{parsed.school}</span>
            {' · '}
            <span>{parsed.level === 0 ? 'Заговор' : `${parsed.level} ур.`}</span>
            {parsed.ritual && ' · Ритуал'}
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-0.5 text-xs text-[var(--text-muted)]">
        <div>Время: {parsed.castingTime || '—'}</div>
        <div>Дистанция: {parsed.range || '—'}</div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<BookOpen size={12} />}
          onClick={onView}
          className="flex-1"
        >
          Подробнее
        </Button>
        {canAdd && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={onAdd}
            title="Добавить персонажу"
          >
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
