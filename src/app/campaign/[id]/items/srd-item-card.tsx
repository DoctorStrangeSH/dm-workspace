'use client'

import { Plus, Package, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName, type SrdLang } from '@/lib/types'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  canEdit: boolean
  lang: SrdLang
  onAddToCharacter: () => void
  onView: () => void
}

// CHANGES: цвета на семантические токены
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
    <Card padding="md" hoverable className="group flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">
            {srdName(item, lang)}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Package size={10} />
            {data.item_type && <span className="truncate capitalize">{data.item_type}</span>}
            {data.attunement && (
              <span className="text-[var(--accent-text)]">· {t('items.attunement.short')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={cn('font-medium', rarityColor)}>
          {t(`itemRarity.${rarityI18nKey(rarity)}`)}
        </span>
        {data.cost && (
          <>
            <span className="text-[var(--text-subtle)]">·</span>
            <span className="text-[var(--warning-text)]">{data.cost}</span>
          </>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<BookOpen size={12} />}
          onClick={onView}
          className="flex-1"
        >
          {t('items.viewDetails')}
        </Button>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={onAddToCharacter}
            title={t('items.addToCharacter')}
          >
            <span className="hidden sm:inline">{t('common.add')}</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
