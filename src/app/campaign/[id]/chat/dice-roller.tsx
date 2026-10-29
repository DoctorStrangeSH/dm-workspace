'use client'

import { useId, useState } from 'react'
import { ChevronDown, Dices } from 'lucide-react'
import { useT } from '@/lib/i18n'

const DICE = [4, 6, 8, 10, 12, 20, 100]

export default function DiceRoller({
  onRoll,
  disabled,
}: {
  onRoll: (sides: number, count: number, modifier: number) => void
  disabled?: boolean
}) {
  const t = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  return (
    <div className="shrink-0 border-t border-[var(--border-default)] px-3 py-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-sm font-medium text-[var(--accent-text)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
      >
        <Dices size={18} aria-hidden="true" />
        {t('chat.dice.toggle')}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={open ? 'ml-auto rotate-180' : 'ml-auto'}
        />
      </button>
      <div id={id} hidden={!open} className="space-y-3 pb-2">
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[var(--text-muted)]">
          <label className="flex items-center justify-between gap-2">
            {t('chat.dice.count')}
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              disabled={disabled}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(20, Math.trunc(Number(e.target.value) || 1))))
              }
              className="h-11 w-16 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] text-center text-base text-[var(--text-primary)] focus:outline-2 focus:outline-[var(--focus-ring)]"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            {t('chat.dice.modifier')}
            <input
              type="number"
              min={-100}
              max={100}
              value={modifier}
              disabled={disabled}
              onChange={(e) =>
                setModifier(Math.max(-100, Math.min(100, Math.trunc(Number(e.target.value) || 0))))
              }
              className="h-11 w-16 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] text-center text-base text-[var(--text-primary)] focus:outline-2 focus:outline-[var(--focus-ring)]"
            />
          </label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DICE.map((sides) => {
            const expression = `${count}d${sides}${modifier ? (modifier > 0 ? '+' : '') + modifier : ''}`
            return (
              <button
                key={sides}
                type="button"
                disabled={disabled}
                onClick={() => onRoll(sides, count, modifier)}
                aria-label={t('chat.dice.roll', { expression })}
                className="min-h-11 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-40"
              >
                d{sides}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
