'use client'

import { Weight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface Props {
  currentWeight: number
  capacity: number
}

export default function EncumbranceBar({ currentWeight, capacity }: Props) {
  const t = useT()
  const percent = capacity > 0 ? (currentWeight / capacity) * 100 : 0
  const isOverloaded = currentWeight > capacity
  const isEncumbered = currentWeight > capacity * 0.67
  const isHeavilyEncumbered = currentWeight > capacity * 0.83

  return (
    <div className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Weight size={16} className="text-[var(--text-muted)]" />
          <span className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {t('inventory.weight.title')}
          </span>
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            isOverloaded
              ? 'text-[var(--danger-text)]'
              : isHeavilyEncumbered
                ? 'text-[var(--danger-text)]'
                : isEncumbered
                  ? 'text-[var(--warning-text)]'
                  : 'text-[var(--text-secondary)]'
          )}
        >
          {currentWeight.toFixed(1)} / {capacity} {t('inventory.weight.lbs')}
        </span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--bg-app)]">
        <div
          className={cn(
            'h-full transition-all',
            isOverloaded
              ? 'bg-[var(--danger)]'
              : isHeavilyEncumbered
                ? 'bg-[var(--danger)]'
                : isEncumbered
                  ? 'bg-[var(--warning)]'
                  : 'bg-[var(--success)]'
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {(isEncumbered || isOverloaded) && (
        <p className="mt-2 text-xs text-[var(--warning-text)]">
          {isOverloaded ? t('inventory.weight.overloaded') : t('inventory.weight.encumbered')}
        </p>
      )}
    </div>
  )
}
