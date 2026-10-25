'use client'

import { useState } from 'react'
import { Dices } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface Props {
  onRoll: (sides: number, count: number, modifier: number) => void
  disabled?: boolean
}

const DICE = [4, 6, 8, 10, 12, 20, 100]

export default function DiceRoller({ onRoll, disabled }: Props) {
  const t = useT()
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)

  return (
    <div className="space-y-2 border-t border-[var(--border-default)] p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[var(--text-muted)]">{t('chat.dice.count')}:</span>
        <input
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="w-14 rounded border border-[var(--border-default)] bg-[var(--bg-app)] px-2 py-1 text-center text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
        <span className="text-[var(--text-muted)]">{t('chat.dice.modifier')}:</span>
        <input
          type="number"
          value={modifier}
          onChange={(e) => setModifier(Number(e.target.value) || 0)}
          className="w-14 rounded border border-[var(--border-default)] bg-[var(--bg-app)] px-2 py-1 text-center text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {DICE.map((sides) => (
          <button
            key={sides}
            onClick={() => onRoll(sides, count, modifier)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1 rounded border px-2 py-1 text-xs transition',
              sides === 20
                ? 'border-[var(--accent)]/50 bg-[var(--accent-subtle)] text-[var(--accent-text)] hover:bg-[var(--accent-subtle)]/80'
                : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]',
              'disabled:opacity-50'
            )}
            title={`${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`}
          >
            <Dices size={10} />d{sides}
          </button>
        ))}
      </div>
    </div>
  )
}
