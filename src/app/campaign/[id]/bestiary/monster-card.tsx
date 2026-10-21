'use client'

import { Plus, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import type { SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  monster: SrdMonster
  canEdit: boolean
  onAdd: () => void
  onView: () => void
}

const TYPE_COLORS: Record<string, string> = {
  dragon: 'text-[var(--danger)]',
  undead: 'text-[var(--accent-text)]',
  fiend: 'text-[var(--danger)]',
  celestial: 'text-[var(--warning-text)]',
  fey: 'text-pink-400',
  beast: 'text-[var(--success)]',
  humanoid: 'text-[var(--info)]',
  giant: 'text-[var(--warning)]',
  construct: 'text-[var(--text-muted)]',
  elemental: 'text-[var(--info-text)]',
  aberration: 'text-[var(--accent-text)]',
  monstrosity: 'text-orange-400',
  ooze: 'text-[var(--success)]',
  plant: 'text-lime-400',
}

export default function MonsterCard({ monster, canEdit, onAdd, onView }: Props) {
  const data = monster.data
  const type = (data.type ?? '').toLowerCase()
  const typeColor = TYPE_COLORS[type] ?? 'text-[var(--text-muted)]'
  const cr = data.cr ?? '—'
  const hp = data.hp ?? data.hp_max ?? '?'
  const ac = data.ac ?? '?'

  return (
    <Card padding="md" hoverable className="group flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">
            {monster.name_ru ?? monster.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className={cn('capitalize', typeColor)}>{type}</span>
            {data.size && (
              <>
                <span className="text-[var(--text-subtle)]">·</span>
                <span className="text-[var(--text-muted)] capitalize">{data.size}</span>
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
          Подробнее
        </Button>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={onAdd}
            title="Добавить в кампанию"
          >
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
