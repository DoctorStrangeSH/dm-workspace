'use client'

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
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 border-b border-[var(--border-default)]', className)}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              active
                ? 'text-[var(--accent-text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && (
              <span className="rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                {item.badge}
              </span>
            )}
            {active && (
              <span className="absolute right-0 -bottom-px left-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
