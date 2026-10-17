'use client'

import { Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { ABILITY_LABELS, ABILITY_SHORT, type AbilityKey } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  ability: AbilityKey
  score: number
  modifier: number
  onRoll?: () => void
  onClick?: () => void
}

export default function AbilityBox({
  ability,
  score,
  modifier,
  onRoll,
  onClick,
}: Props) {
  return (
    <div
      className={cn(
        'group relative bg-slate-900 border border-slate-800 hover:border-indigo-700 rounded-xl p-3 text-center transition',
        (onRoll || onClick) && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
        {ABILITY_SHORT[ability]}
      </div>

      <div className="text-2xl font-bold">{score}</div>

      <div
        className={cn(
          'mt-1 inline-block px-2 py-0.5 rounded text-xs font-medium',
          modifier >= 0
            ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/50'
            : 'bg-red-950/60 text-red-300 border border-red-900/50'
        )}
      >
        {formatModifier(modifier)}
      </div>

      {onRoll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRoll()
          }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition"
          title={`Бросок ${ABILITY_LABELS[ability]}`}
        >
          <Dices size={12} className="text-slate-400" />
        </button>
      )}
    </div>
  )
}