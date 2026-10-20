'use client'

import { useEffect, useRef, useState } from 'react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import type { EntitySuggestion } from '@/lib/codemirror/wikilink-completion'

interface Props {
  query: string
  entities: EntitySuggestion[]
  position: { top: number; left: number }
  onSelect: (entity: EntitySuggestion) => void
  onClose: () => void
}

export default function WikilinkDropdown({ query, entities, position, onSelect, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = entities
    .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10)

  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered[activeIndex]) {
          e.preventDefault()
          onSelect(filtered[activeIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [filtered, activeIndex, onSelect, onClose])

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (filtered.length === 0) {
    return (
      <div
        className="absolute z-50 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-muted)] shadow-[var(--shadow-xl)]"
        style={{ top: position.top, left: position.left }}
      >
        Ничего не найдено
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="absolute z-50 max-h-[280px] max-w-[320px] min-w-[240px] overflow-hidden overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xl)]"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((entity, i) => {
        const style = ENTITY_STYLES[entity.type]
        const isActive = i === activeIndex
        return (
          <div
            key={entity.id}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(entity)
            }}
            className={cn(
              'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
              isActive
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <span className="text-lg">{style.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{entity.name}</div>
              <div className="text-xs text-[var(--text-subtle)]">{style.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
