'use client'

import { useT } from '@/lib/i18n'
import type { CombatCondition } from '@/lib/maps/combat-conditions'
import { cn } from '@/lib/utils'

export default function CombatConditions({
  conditions,
  compact = false,
}: {
  conditions: CombatCondition[]
  compact?: boolean
}) {
  const t = useT()
  if (!conditions.length) return null
  const shown = compact ? conditions.slice(0, 2) : conditions
  return (
    <span
      className={cn('mt-2 flex max-w-full flex-wrap gap-1', compact && 'justify-center')}
      role="group"
      aria-label={t('combatFinder.conditions')}
    >
      {shown.map(({ key, label }) => (
        <span
          key={key}
          className={cn(
            'max-w-full rounded-md border border-[var(--warning)]/30 bg-[var(--warning-subtle)] px-1.5 py-1 [overflow-wrap:anywhere] text-[var(--warning-text)]',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {label}
        </span>
      ))}
      {compact && conditions.length > shown.length && (
        <span
          className="rounded-md bg-[var(--bg-app)] px-1.5 py-1 text-[10px] text-[var(--text-secondary)]"
          title={conditions
            .slice(shown.length)
            .map((condition) => condition.label)
            .join(' · ')}
        >
          {t('combatFinder.moreConditions', { count: conditions.length - shown.length })}
        </span>
      )}
    </span>
  )
}
