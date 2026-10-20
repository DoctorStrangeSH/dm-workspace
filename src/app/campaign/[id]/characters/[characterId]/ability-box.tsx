'use client'

import { Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { ABILITY_LABELS, ABILITY_SHORT, type AbilityKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, IconButton } from '@/components/ui'

interface Props {
  ability: AbilityKey
  score: number
  modifier: number
  onRoll?: () => void
  onClick?: () => void
}

export default function AbilityBox({ ability, score, modifier, onRoll, onClick }: Props) {
  return (
    <Card
      padding="sm"
      className={cn(
        'group relative text-center transition-colors hover:border-[var(--border-hover)]',
        (onRoll || onClick) && 'cursor-pointer'
      )}
    >
      <div onClick={onClick}>
        <div className="mb-1 text-[10px] tracking-wider text-[var(--text-subtle)] uppercase">
          {ABILITY_SHORT[ability]}
        </div>

        <div className="text-2xl font-bold text-[var(--text-primary)]">{score}</div>

        <div
          className={cn(
            'mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium',
            modifier >= 0
              ? 'border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-[var(--accent-text)]'
              : 'border border-[var(--danger)]/30 bg-[var(--danger-subtle)] text-[var(--danger-text)]'
          )}
        >
          {formatModifier(modifier)}
        </div>
      </div>

      {onRoll && (
        <IconButton
          variant="ghost"
          size="sm"
          label={`Бросок ${ABILITY_LABELS[ability]}`}
          onClick={(e) => {
            e.stopPropagation()
            onRoll()
          }}
          className="absolute top-1.5 right-1.5 opacity-0 transition group-hover:opacity-100"
        >
          <Dices size={12} />
        </IconButton>
      )}
    </Card>
  )
}
