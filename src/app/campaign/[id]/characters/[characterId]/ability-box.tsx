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

export default function AbilityBox({ ability, score, modifier, onRoll, onClick }: Props) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-slate-800 bg-slate-900 p-3 text-center transition hover:border-indigo-700',
        (onRoll || onClick) && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="mb-1 text-[10px] tracking-wider text-slate-500 uppercase">
        {ABILITY_SHORT[ability]}
      </div>

      <div className="text-2xl font-bold">{score}</div>

      <div
        className={cn(
          'mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium',
          modifier >= 0
            ? 'border border-indigo-900/50 bg-indigo-950/60 text-indigo-300'
            : 'border border-red-900/50 bg-red-950/60 text-red-300'
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
          className="absolute top-1.5 right-1.5 rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-slate-800"
          title={`Бросок ${ABILITY_LABELS[ability]}`}
        >
          <Dices size={12} className="text-slate-400" />
        </button>
      )}
    </div>
  )
}
