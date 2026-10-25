'use client'

import { Plus, BookOpen } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName, type SrdLang } from '@/lib/types'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  canAdd: boolean
  lang: SrdLang
  onAdd: () => void
  onView: () => void
}

// CHANGES: цвета на семантические токены
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
  const schoolKey = parsed.school.toLowerCase()
  const schoolColor = SCHOOL_COLORS[schoolKey] ?? 'text-[var(--text-muted)]'

  const levelLabel =
    parsed.level === 0 ? t('spells.cantrip') : t('spells.levelShort', { level: parsed.level })

  return (
    <Card padding="md" hoverable className="group flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">
            {srdName(spell, lang)}
          </h3>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            <span className={schoolColor}>{t(`school.${schoolKey}`)}</span>
            {' · '}
            <span>{levelLabel}</span>
            {parsed.ritual && ` · ${t('spells.ritual')}`}
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-0.5 text-xs text-[var(--text-muted)]">
        <div>
          {t('spells.castingTime')}: {parsed.castingTime || '—'}
        </div>
        <div>
          {t('spells.range')}: {parsed.range || '—'}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<BookOpen size={12} />}
          onClick={onView}
          className="flex-1"
        >
          {t('spells.viewDetails')}
        </Button>
        {canAdd && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={onAdd}
            title={t('spells.addToCharacter')}
          >
            <span className="hidden sm:inline">{t('common.add')}</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
