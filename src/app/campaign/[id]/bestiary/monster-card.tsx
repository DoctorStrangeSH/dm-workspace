'use client'

import { Plus, BookOpen, Shield, Heart, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName, type SrdLang } from '@/lib/types'
import { monsterCategoryLabel } from '@/lib/srd/monster-display'
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
  const type = (data.type ?? '').trim().toLowerCase()
  const size = (data.size ?? '').trim().toLowerCase()
  const typeColor = TYPE_COLORS[type] ?? 'text-[var(--text-muted)]'
  const cr = data.cr ?? '—'
  const hp = data.hp ?? data.hp_max ?? '—'
  const ac = data.ac ?? '—'

  return (
    <Card
      padding="none"
      hoverable
      className="group relative flex h-full min-h-64 flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-md)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(110deg,var(--bg-elevated),var(--bg-secondary))]"
      >
        <div className="absolute -top-10 -right-5 h-36 w-36 rounded-full border border-[var(--accent)]/15" />
        <div className="absolute top-0 right-5 h-28 w-28 rotate-45 border border-[var(--accent)]/10" />
      </div>
      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--bg-primary)] text-[var(--accent-text)]">
            <Swords size={21} aria-hidden="true" />
          </div>
          <span className="inline-flex min-w-14 flex-col items-center rounded-xl border border-[var(--warning)]/25 bg-[var(--bg-primary)] px-2 py-1 text-[var(--warning-text)]">
            <span className="text-[10px] font-medium tracking-wider">CR</span>
            <span className="text-lg leading-tight font-bold tabular-nums">{cr}</span>
          </span>
        </div>
        <h3 className="text-lg leading-snug font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {srdName(monster, lang)}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {type && (
            <span
              className={cn(
                'max-w-full rounded-full bg-[var(--bg-secondary)] px-2 py-1 [overflow-wrap:anywhere]',
                typeColor
              )}
            >
              {monsterCategoryLabel('type', data.type, t)}
            </span>
          )}
          {size && (
            <span className="max-w-full rounded-full border border-[var(--border-default)] px-2 py-1 [overflow-wrap:anywhere] text-[var(--text-muted)]">
              {monsterCategoryLabel('size', data.size, t)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-5">
          <div className="mb-4 grid grid-cols-2 gap-2 border-t border-[var(--border-default)] pt-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Heart size={16} className="shrink-0 text-[var(--danger-text)]" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">
                {t('bestiary.stats.hpShort')} {hp}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 text-sm text-[var(--text-secondary)]">
              <Shield size={16} className="shrink-0 text-[var(--info-text)]" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">
                {t('bestiary.stats.acShort')} {ac}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              size="md"
              icon={<BookOpen size={16} aria-hidden="true" />}
              onClick={onView}
              className="w-full min-w-0 sm:flex-1"
            >
              {t('bestiary.viewDetails')}
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                size="md"
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={onAdd}
                className="w-full sm:w-auto"
                title={t('bestiary.addToCampaign')}
                aria-label={t('bestiary.addToCampaign')}
              >
                <span>{t('bestiary.add')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
