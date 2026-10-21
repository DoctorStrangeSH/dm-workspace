'use client'

import { Plus, Package, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import type { SrdItem } from '@/lib/actions/items-search'

interface Props {
  item: SrdItem
  canEdit: boolean
  onAddToCharacter: () => void
  onView: () => void
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-[var(--text-muted)]',
  uncommon: 'text-[var(--success)]',
  rare: 'text-[var(--info)]',
  'very rare': 'text-[var(--accent-text)]',
  legendary: 'text-[var(--warning)]',
  artifact: 'text-[var(--danger)]',
}

export default function SrdItemCard({ item, canEdit, onAddToCharacter, onView }: Props) {
  const data = item.data
  const rarity = (data.rarity ?? 'common').toLowerCase()
  const rarityColor = RARITY_COLORS[rarity] ?? 'text-[var(--text-muted)]'

  return (
    <Card padding="md" hoverable className="group flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">
            {item.name_ru ?? item.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Package size={10} />
            {data.item_type && <span className="truncate capitalize">{data.item_type}</span>}
            {data.attunement && <span className="text-[var(--accent-text)]">· настройка</span>}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={cn('font-medium capitalize', rarityColor)}>{rarity}</span>
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
          Подробнее
        </Button>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={onAddToCharacter}
            title="Добавить персонажу"
          >
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
