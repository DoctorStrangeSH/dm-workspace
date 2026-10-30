'use client'

import { Plus, Package, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName, type SrdLang } from '@/lib/types'
import { srdItemTypeLabel } from '@/lib/srd/item-display'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  canEdit: boolean
  lang: SrdLang
  onAddToCharacter: () => void
  onView: () => void
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-[var(--text-muted)]',
  uncommon: 'text-[var(--success-text)]',
  rare: 'text-[var(--info-text)]',
  'very rare': 'text-[var(--accent-text)]',
  legendary: 'text-[var(--warning-text)]',
  artifact: 'text-[var(--danger-text)]',
}

function rarityI18nKey(raw: string): string {
  return raw.replace(/\s+([a-z])/g, (_, c: string) => c.toUpperCase())
}

export default function SrdItemCard({ item, canEdit, lang, onAddToCharacter, onView }: Props) {
  const { t } = useI18n()
  const data = item.data
  const rarity = (data.rarity ?? 'common').toLowerCase()
  const rarityColor = RARITY_COLORS[rarity] ?? 'text-[var(--text-muted)]'

  return (
    <Card
      padding="none"
      hoverable
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border-default)] bg-[linear-gradient(110deg,var(--bg-elevated),var(--bg-secondary))] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--bg-primary)] text-[var(--accent-text)]">
          <Package size={20} aria-hidden="true" />
        </div>
        <span className={cn('text-xs font-medium', rarityColor)}>
          {t(`itemRarity.${rarityI18nKey(rarity)}`)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-snug font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {srdName(item, lang)}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          {data.item_type && (
            <span className="rounded-full border border-[var(--border-default)] px-2.5 py-1 [overflow-wrap:anywhere]">
              {srdItemTypeLabel(data.item_type, lang)}
            </span>
          )}
          {data.attunement && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-[var(--accent-text)]">
              <Sparkles size={12} aria-hidden="true" />
              {t('items.attunement.short')}
            </span>
          )}
        </div>
        <div className="mt-auto pt-4">
          {data.cost && (
            <p className="mb-3 text-sm [overflow-wrap:anywhere] text-[var(--warning-text)]">
              <span className="text-[var(--text-muted)]">{t('items.cost')}: </span>
              {data.cost}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<BookOpen size={16} aria-hidden="true" />}
              onClick={onView}
              className="min-h-11 min-w-0 flex-1"
            >
              {t('items.viewDetails')}
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={onAddToCharacter}
                className="min-h-11"
                title={t('items.addToCharacter')}
                aria-label={t('items.addToCharacter')}
              >
                {t('common.add')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
