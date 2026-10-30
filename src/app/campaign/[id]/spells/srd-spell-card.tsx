'use client'

import { Plus, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName, type SrdLang } from '@/lib/types'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import { spellSchoolLabel } from '@/lib/srd/spell-display'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  canAdd: boolean
  lang: SrdLang
  onAdd: () => void
  onView: () => void
}

const SCHOOL_COLORS: Record<string, string> = {
  evocation: 'text-[var(--danger-text)]',
  abjuration: 'text-[var(--info-text)]',
  conjuration: 'text-[var(--accent-text)]',
  divination: 'text-[var(--success-text)]',
  enchantment: 'text-[var(--warning-text)]',
  illusion: 'text-[var(--accent-text)]',
  necromancy: 'text-[var(--text-muted)]',
  transmutation: 'text-[var(--warning-text)]',
}

export default function SrdSpellCard({ spell, canAdd, lang, onAdd, onView }: Props) {
  const { t } = useI18n()
  const parsed = parseSpellForDisplay(spell.data)
  const schoolColor =
    SCHOOL_COLORS[parsed.school.trim().toLowerCase()] ?? 'text-[var(--text-muted)]'
  const levelLabel =
    parsed.level === 0 ? t('spells.cantrip') : t('spells.levelShort', { level: parsed.level })
  const parameters = [
    [t('spells.castingTime'), parsed.castingTime],
    [t('spells.range'), parsed.range],
    [t('spells.duration'), parsed.duration],
    [t('spells.components'), parsed.components],
  ]

  return (
    <Card
      padding="none"
      hoverable
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border-default)] bg-[linear-gradient(110deg,var(--bg-elevated),var(--bg-secondary))] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--bg-primary)] text-[var(--accent-text)]">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-[var(--accent-text)]">{levelLabel}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-snug font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {srdName(spell, lang)}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              'rounded-full border border-[var(--border-default)] px-2.5 py-1 [overflow-wrap:anywhere]',
              schoolColor
            )}
          >
            {spellSchoolLabel(parsed.school, t)}
          </span>
          {parsed.ritual && (
            <span className="rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-[var(--accent-text)]">
              {t('spells.ritual')}
            </span>
          )}
          {parsed.concentration && (
            <span className="rounded-full bg-[var(--warning-subtle)] px-2.5 py-1 text-[var(--warning-text)]">
              {t('spells.concentration')}
            </span>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[var(--border-default)] pt-3 text-xs">
          {parameters.map(([label, value]) => (
            <div key={label} className="min-w-0 [overflow-wrap:anywhere]">
              <dt className="text-[var(--text-muted)]">{label}</dt>
              <dd className="mt-1 leading-relaxed text-[var(--text-secondary)]">{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            icon={<BookOpen size={16} aria-hidden="true" />}
            onClick={onView}
            className="min-h-11 min-w-0 flex-1"
          >
            {t('spells.viewDetails')}
          </Button>
          {canAdd && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} aria-hidden="true" />}
              onClick={onAdd}
              className="min-h-11"
              title={t('spells.addToCharacter')}
              aria-label={t('spells.addToCharacter')}
            >
              {t('common.add')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
