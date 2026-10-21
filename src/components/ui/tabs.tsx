'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  items: TabItem[]
  className?: string
}

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    if (!buttons) return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (index + 1) % buttons.length
      buttons[next]?.focus()
      onValueChange(items[next].value)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (index - 1 + buttons.length) % buttons.length
      buttons[prev]?.focus()
      onValueChange(items[prev].value)
    } else if (e.key === 'Home') {
      e.preventDefault()
      buttons[0]?.focus()
      onValueChange(items[0].value)
    } else if (e.key === 'End') {
      e.preventDefault()
      buttons[buttons.length - 1]?.focus()
      onValueChange(items[items.length - 1].value)
    }
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-orientation="horizontal"
      className={cn('flex items-center gap-1 border-b border-[var(--border-default)]', className)}
    >
      {items.map((item, i) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${item.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              active
                ? 'text-[var(--accent-text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
            {item.badge !== undefined && (
              <span className="rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                {item.badge}
              </span>
            )}
            {active && (
              <span
                className="absolute right-0 -bottom-px left-0 h-0.5 bg-[var(--accent)]"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
