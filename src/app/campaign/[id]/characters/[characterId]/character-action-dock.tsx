'use client'

import { useState } from 'react'
import { Swords, Dices } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { abilityModifier, formatModifier, getInitiative } from '@/lib/dnd/formulas'
import { rollChatDice, type D20Mode } from '@/lib/dnd/chat-dice'
import { rollCharacterDamage } from '@/lib/dnd/character-workspace'
import { readCharacterHP } from '@/lib/dnd/character-hp'
import type { AbilityKey, CharacterData } from '@/lib/types'
import { abilityLabel } from '@/lib/i18n/labels'

export default function CharacterActionDock({ data }: { data: CharacterData }) {
  const { t, lang } = useI18n()
  const [mode, setMode] = useState<D20Mode>('normal')
  const [ability, setAbility] = useState<AbilityKey>('str')
  const [history, setHistory] = useState<
    Array<{ label: string; formula: string; total: number; rolls: number[] }>
  >([])
  const [error, setError] = useState(false)
  const hp = readCharacterHP(data.hp)
  function record(label: string, result: ReturnType<typeof rollCharacterDamage>) {
    setError(!result)
    if (result)
      setHistory((previous) =>
        [
          { label, formula: result.expression, total: result.total, rolls: result.rolls },
          ...previous,
        ].slice(0, 5)
      )
  }
  return (
    <aside
      aria-label={t('sheet.dock')}
      className="min-w-0 space-y-4 xl:sticky xl:top-[calc(var(--campaign-header-height,10rem)+1rem)] xl:max-h-[calc(100dvh-var(--campaign-header-height,10rem)-2rem)] xl:overflow-y-auto xl:overscroll-contain"
    >
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <Swords size={18} aria-hidden="true" />
          {t('sheet.dock')}
        </h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[
            [t('sheet.hp'), hp ? `${hp.current}/${hp.max}` : '—'],
            [t('sheet.ac'), data.ac],
            [t('characters.initiative'), formatModifier(getInitiative(data))],
            [t('sheet.speed'), `${data.speed} ${lang === 'ru' ? 'фт' : 'ft'}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--bg-secondary)] p-3">
              <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
              <dd className="mt-1 text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <label className="mt-4 block text-xs text-[var(--text-muted)]">
          {t('sheet.mode')}
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as D20Mode)}
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-2 text-sm text-[var(--text-primary)]"
          >
            {(['normal', 'advantage', 'disadvantage'] as const).map((key) => (
              <option key={key} value={key}>
                {t('sheet.' + key)}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex gap-2">
          <select
            aria-label={t('sheet.ability')}
            value={ability}
            onChange={(event) => setAbility(event.target.value as AbilityKey)}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-2 text-sm text-[var(--text-primary)]"
          >
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => (
              <option key={key} value={key}>
                {abilityLabel(lang, key)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              record(
                abilityLabel(lang, ability),
                rollChatDice(20, 1, abilityModifier(data.abilities[ability]), mode)
              )
            }
            className="min-h-11 rounded-lg bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-foreground)]"
          >
            {t('sheet.check')}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {(data.attacks ?? []).map((attack, index) => (
            <div key={index} className="rounded-xl border border-[var(--border-default)] p-3">
              <h3 className="text-sm font-semibold break-words text-[var(--text-primary)]">
                {attack.name}
              </h3>
              {attack.notes && (
                <p className="mt-1 text-xs break-words text-[var(--text-muted)]">{attack.notes}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => record(attack.name, rollChatDice(20, 1, attack.bonus, mode))}
                  className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 text-xs font-medium text-[var(--accent-text)]"
                >
                  {t('sheet.attack')} {formatModifier(attack.bonus)}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    record(
                      `${attack.name} · ${t('sheet.damage')}`,
                      rollCharacterDamage(attack.damage)
                    )
                  }
                  className="min-h-11 rounded-lg border border-[var(--border-default)] px-3 text-xs font-medium text-[var(--text-primary)]"
                >
                  {t('sheet.damage')} {attack.damage}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{t('sheet.rollHint')}</p>
        {error && (
          <p role="alert" className="mt-2 text-xs text-[var(--danger-text)]">
            {t('sheet.rollError')}
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Dices size={16} aria-hidden="true" />
          {t('sheet.history')}
        </h3>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="mt-3 text-sm break-words text-[var(--text-primary)]"
        >
          {history[0]
            ? `${history[0].label}: ${history[0].total} · ${history[0].formula} [${history[0].rolls.join(', ')}]`
            : t('sheet.noRolls')}
        </div>
        {history.length > 1 && (
          <ol className="mt-3 space-y-2 border-t border-[var(--border-default)] pt-3 text-xs text-[var(--text-muted)]">
            {history.slice(1).map((roll, index) => (
              <li key={index} className="break-words">
                {roll.label}: <strong>{roll.total}</strong> · {roll.formula} [
                {roll.rolls.join(', ')}]
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}
