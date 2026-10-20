'use client'

import { formatModifier } from '@/lib/dnd/formulas'
import { ABILITY_SHORT, type AbilityKey } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  proficientSaves: AbilityKey[]
  getBonus: (save: AbilityKey) => number
  onRoll?: (save: AbilityKey) => void
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function SavesList({
  proficientSaves,
  getBonus,
  onRoll,
}: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Спасброски
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
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
                'group flex items-center gap-2 px-2 py-1.5 rounded text-sm transition',
                onRoll && 'hover:bg-slate-800/60',
                !onRoll && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  isProficient
                    ? 'bg-amber-400'
                    : 'bg-slate-700 border border-slate-600'
                )}
              />
              <span className="flex-1 text-slate-300">{ABILITY_SHORT[ability]}</span>
              <span
                className={cn(
                  'font-medium',
                  isProficient ? 'text-amber-300' : 'text-slate-400'
                )}
              >
                {formatModifier(bonus)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}