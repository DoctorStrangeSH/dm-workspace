'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { Search, X } from 'lucide-react'
import DmEntityItem from './dm-entity-item'
import { cn } from '@/lib/utils'
import type { Entity, EntityType } from '@/lib/types'
import { EmptyState } from '@/components/ui'

interface Props {
  entities: Entity[]
  campaignId: string
  recentIds: string[]
  onSelect: (entityId: string) => void
}

type FilterType = 'all' | EntityType

// CHANGES: useSyncExternalStore вместо useEffect+setState(mounted).
// React 19 не любит setState в useEffect — это вызывает warning.
// useSyncExternalStore: на сервере false, на клиенте true, без setState.
const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function DmEntityList({ entities, campaignId, recentIds, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const filtered = useMemo(() => {
    let list = entities

    if (filter !== 'all') {
      list = list.filter((e) => e.type === filter)
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim()
      list = list.filter((e) => e.name.toLowerCase().includes(q))
    }

    return list
  }, [entities, query, filter])

  const recentEntities = useMemo(() => {
    if (!mounted || recentIds.length === 0) return []
    return recentIds
      .map((id) => entities.find((e) => e.id === id))
      .filter((e): e is Entity => e !== undefined)
  }, [recentIds, entities, mounted])

  const showRecent = mounted && recentEntities.length > 0 && !query.trim() && filter === 'all'

  const filters: { value: FilterType; label: string; title: string }[] = [
    { value: 'all', label: 'Все', title: 'Все типы' },
    { value: 'npc', label: '👤', title: 'NPC' },
    { value: 'location', label: '🗺️', title: 'Локации' },
    { value: 'item', label: '⚔️', title: 'Предметы' },
    { value: 'monster', label: '👹', title: 'Монстры' },
    { value: 'faction', label: '🏛️', title: 'Фракции' },
    { value: 'quest', label: '📜', title: 'Квесты' },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border-default)] p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-subtle)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск сущностей..."
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] py-2 pr-9 pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 hover:bg-[var(--bg-hover)]"
              title="Очистить"
            >
              <X size={14} className="text-[var(--text-subtle)]" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded px-2.5 py-1 text-xs transition-colors',
                filter === f.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              )}
              title={f.title}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {showRecent && (
          <>
            <div className="px-3 pt-2 pb-1 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
              Недавние
            </div>
            {recentEntities.map((e) => (
              <DmEntityItem
                key={`recent-${e.id}`}
                entity={e}
                campaignId={campaignId}
                onSelect={onSelect}
              />
            ))}
            <div className="my-2 border-t border-[var(--border-default)]" />
          </>
        )}

        {filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={query.trim() || filter !== 'all' ? '🔍' : '👥'}
              title={query.trim() || filter !== 'all' ? 'Ничего не найдено' : 'Пока нет сущностей'}
              description={
                query.trim() || filter !== 'all'
                  ? 'Попробуй изменить фильтр или поиск'
                  : 'Создай первую сущность в кампании'
              }
              size="sm"
              dashed={false}
            />
          </div>
        ) : (
          <>
            {showRecent && (
              <div className="px-3 pt-2 pb-1 text-xs tracking-wider text-[var(--text-subtle)] uppercase">
                Все сущности
              </div>
            )}
            {filtered.map((e) => (
              <DmEntityItem key={e.id} entity={e} campaignId={campaignId} onSelect={onSelect} />
            ))}
          </>
        )}
      </div>

      <div className="border-t border-[var(--border-default)] px-4 py-2 text-xs text-[var(--text-muted)]">
        Найдено: {filtered.length} из {entities.length}
      </div>
    </div>
  )
}
