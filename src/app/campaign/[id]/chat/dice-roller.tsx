'use client'

import { useId, useState } from 'react'
import { ChevronDown, Dices } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { CHAT_DICE, chatDiceExpression, diceDraft, type D20Mode } from '@/lib/dnd/chat-dice'

export default function DiceRoller({
  onRoll,
  disabled,
  error,
}: {
  onRoll: (sides: number, count: number, modifier: number, mode?: D20Mode) => void
  disabled?: boolean
  error?: string | null
}) {
  const t = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState('1')
  const [modifier, setModifier] = useState('0')
  const draft = diceDraft(count, modifier)
  return (
    <div className="flex max-h-[min(45dvh,28rem)] min-h-0 shrink flex-col border-t border-[var(--border-default)] px-3 py-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full shrink-0 items-center gap-2 rounded-xl px-2 text-sm font-medium text-[var(--accent-text)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
      >
        <Dices size={18} aria-hidden="true" />
        {t('chat.dice.toggle')}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={open ? 'ml-auto rotate-180' : 'ml-auto'}
        />
      </button>
      {error && (
        <p role="alert" className="shrink-0 px-2 pb-2 text-xs leading-5 text-[var(--danger-text)]">
          {error}
        </p>
      )}
      <div
        id={id}
        hidden={!open}
        className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1 pb-2"
      >
        <p className="pt-2 text-xs leading-5 text-[var(--text-muted)]">{t('chat.dice.sendHint')}</p>
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[var(--text-muted)]">
          <label className="flex min-w-0 flex-col gap-2">
            {t('chat.dice.count')}
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={count}
              aria-invalid={!draft.validCount}
              aria-describedby={!draft.validCount ? id + '-count-error' : undefined}
              disabled={disabled}
              onChange={(e) => setCount(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] text-center text-base text-[var(--text-primary)] focus:outline-2 focus:outline-[var(--focus-ring)]"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2">
            {t('chat.dice.modifier')}
            <input
              type="text"
              inputMode="text"
              maxLength={5}
              value={modifier}
              aria-invalid={!draft.validModifier}
              aria-describedby={!draft.validModifier ? id + '-bonus-error' : undefined}
              disabled={disabled}
              onChange={(e) => setModifier(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] text-center text-base text-[var(--text-primary)] focus:outline-2 focus:outline-[var(--focus-ring)]"
            />
          </label>
        </div>
        {!draft.validCount && (
          <p id={id + '-count-error'} className="text-xs text-[var(--danger-text)]">
            {t('chat.dice.countError')}
          </p>
        )}
        {!draft.validModifier && (
          <p id={id + '-bonus-error'} className="text-xs text-[var(--danger-text)]">
            {t('chat.dice.modifierError')}
          </p>
        )}
        <div className="grid grid-cols-4 gap-2">
          {CHAT_DICE.map((sides) => {
            const expression = draft.valid
              ? chatDiceExpression(sides, draft.count, draft.modifier)!
              : `d${sides}`
            return (
              <button
                key={sides}
                type="button"
                disabled={disabled || !draft.valid}
                onClick={() => onRoll(sides, draft.count, draft.modifier)}
                aria-label={t('chat.dice.roll', { expression })}
                className="min-h-14 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-40"
              >
                <span className="block">d{sides}</span>
                <span className="mt-1 block text-[10px] font-normal text-[var(--text-muted)]">
                  {expression}
                </span>
              </button>
            )
          })}
        </div>
        <fieldset className="space-y-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-3">
          <legend className="px-1 text-xs font-semibold text-[var(--accent-text)]">
            {t('chat.dice.d20Title')}
          </legend>
          <p className="text-xs leading-5 text-[var(--text-secondary)]">{t('chat.dice.d20Hint')}</p>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {(['advantage', 'disadvantage'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={disabled || !draft.validModifier}
                aria-label={t('chat.dice.specialRoll', {
                  mode: t('chat.dice.' + mode),
                  expression: draft.validModifier
                    ? chatDiceExpression(20, 1, draft.modifier, mode)!
                    : 'd20',
                })}
                onClick={() => onRoll(20, 1, draft.modifier, mode)}
                className="min-h-11 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-40"
              >
                {t('chat.dice.' + mode)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
