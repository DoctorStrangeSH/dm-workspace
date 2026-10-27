'use client'

import { formatModifier } from '@/lib/dnd/formulas'
import type { AbilityKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { abilityShort } from '@/lib/i18n/labels'
import { Card } from '@/components/ui'

interface Props {
  proficientSaves: AbilityKey[]
  getBonus: (save: AbilityKey) => number
  onRoll?: (save: AbilityKey) => void
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function SavesList({ proficientSaves, getBonus, onRoll }: Props) {
  const { t, lang } = useI18n()

  return (
    <Card padding="md">
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        {t('characters.saves')}
      </h3>

      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {ABILITIES.map((ability) => {
          const isProficient = proficientSaves.includes(ability)
          const bonus = getBonus(ability)

          return (
            <button
              key={ability}
              type="button"
              onClick={() => onRoll?.(ability)}
              disabled={!onRoll}
              className={cn(
                'group flex min-h-11 items-center gap-2 rounded px-2 py-2 text-sm transition-colors touch-manipulation',
                onRoll && 'hover:bg-[var(--bg-hover)]',
                !onRoll && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  isProficient
                    ? 'bg-[var(--warning)]'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-tertiary)]'
                )}
              />
              <span className="flex-1 text-[var(--text-secondary)]">
                {abilityShort(lang, ability)}
              </span>
              <span
                className={cn(
                  'font-medium',
                  isProficient ? 'text-[var(--warning-text)]' : 'text-[var(--text-muted)]'
                )}
              >
                {formatModifier(bonus)}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
