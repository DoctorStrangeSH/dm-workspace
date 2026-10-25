'use client'

import { Plus, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName, type SrdLang } from '@/lib/types'
import type { SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  monster: SrdMonster
  canEdit: boolean
  lang: SrdLang
  onAdd: () => void
  onView: () => void
}

// CHANGES: цвета переведены на семантические токены.
const TYPE_COLORS: Record<string, string> = {
  dragon: 'text-[var(--danger-text)]',
  undead: 'text-[var(--accent-text)]',
  fiend: 'text-[var(--danger-text)]',
  celestial: 'text-[var(--warning-text)]',
  fey: 'text-[var(--accent-text)]',
  beast: 'text-[var(--success-text)]',
  humanoid: 'text-[var(--info-text)]',
  giant: 'text-[var(--warning-text)]',
  construct: 'text-[var(--text-muted)]',
  elemental: 'text-[var(--info-text)]',
  aberration: 'text-[var(--accent-text)]',
  monstrosity: 'text-[var(--danger-text)]',
  ooze: 'text-[var(--success-text)]',
  plant: 'text-[var(--success-text)]',
}

export default function MonsterCard({ monster, canEdit, lang, onAdd, onView }: Props) {
  const { t } = useI18n()
  const data = monster.data
  const type = (data.type ?? '').toLowerCase()
  const size = (data.size ?? '').toLowerCase()
  const typeColor = TYPE_COLORS[type] ?? 'text-[var(--text-muted)]'
  const cr = data.cr ?? '—'
  const hp = data.hp ?? data.hp_max ?? '?'
  const ac = data.ac ?? '?'

  return (
    <Card padding="md" hoverable className="group flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">
            {srdName(monster, lang)}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            {type && <span className={cn(typeColor)}>{t(`monsterType.${type}`)}</span>}
            {size && (
              <>
                <span className="text-[var(--text-subtle)]">·</span>
                <span className="text-[var(--text-muted)]">{t(`monsterSize.${size}`)}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs tracking-wider text-[var(--text-subtle)] uppercase">CR</div>
          <div className="text-lg font-bold text-[var(--warning-text)]">{cr}</div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span>HP: {hp}</span>
        <span className="text-[var(--text-subtle)]">·</span>
        <span>AC: {ac}</span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<BookOpen size={12} />}
          onClick={onView}
          className="flex-1"
        >
          {t('bestiary.viewDetails')}
        </Button>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={onAdd}
            title={t('bestiary.addToCampaign')}
          >
            <span className="hidden sm:inline">{t('bestiary.add')}</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
