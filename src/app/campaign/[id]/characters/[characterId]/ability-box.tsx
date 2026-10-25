'use client'

import { Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import type { AbilityKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { abilityLabel, abilityShort } from '@/lib/i18n/labels'
import { Card, IconButton } from '@/components/ui'

interface Props {
  ability: AbilityKey
  score: number
  modifier: number
  onRoll?: () => void
  onClick?: () => void
}

export default function AbilityBox({ ability, score, modifier, onRoll, onClick }: Props) {
  const { t, lang } = useI18n()

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
          {abilityShort(lang, ability)}
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
          label={t('characters.rollAbility', { ability: abilityLabel(lang, ability) })}
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
