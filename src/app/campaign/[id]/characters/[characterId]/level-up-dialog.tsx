'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, Dices, Sparkles } from 'lucide-react'
import { levelUp } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { getAverageHP, getHPGainRange, getLevelUpIssue, abilityChangesError } from '@/lib/dnd/level-up'
import { MAX_CHARACTER_HP } from '@/lib/dnd/character-hp'
import { abilityModifier } from '@/lib/dnd/formulas'
import { hasASI } from '@/lib/dnd/constants'
import { useI18n } from '@/lib/i18n'
import { abilityLabel } from '@/lib/i18n/labels'
import { cn } from '@/lib/utils'
import type { AbilityKey, Character } from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  onClose: () => void
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

type HPChoice = 'average' | 'roll'
type ASIMode = 'plus2' | 'plus1plus1'

export default function LevelUpDialog({ character, campaignId, onClose }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const data = character.data_json

  const [hpChoice, setHpChoice] = useState<HPChoice>('average')
  const [asiMode, setAsiMode] = useState<ASIMode>('plus2')
  const [asiAbility1, setAsiAbility1] = useState<AbilityKey | null>(null)
  const [asiAbility2, setAsiAbility2] = useState<AbilityKey | null>(null)

  const issue = getLevelUpIssue(data)
  if (issue) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
          <p role="alert" className="mb-4 text-[var(--text-secondary)]">{t(`levelUp.error.${issue}`)}</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)]"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    )
  }

  const newLevel = data.level + 1
  const showASI = hasASI(newLevel)
  const conMod = abilityModifier(data.abilities.con)
  const averageHP = getAverageHP(data.class, conMod)
  const range = getHPGainRange(data.class, conMod)!
  const hpOverflow = data.hp.max > MAX_CHARACTER_HP - (hpChoice === 'average' ? averageHP : range.max)
  const abilityChanges: Partial<Record<string, number>> = {}
  if (showASI) {
    if (asiMode === 'plus2' && asiAbility1) abilityChanges[asiAbility1] = 2
    else if (asiMode === 'plus1plus1') {
      if (asiAbility1) abilityChanges[asiAbility1] = 1
      if (asiAbility2) abilityChanges[asiAbility2] = 1
    }
  }
  const canSubmit = () => !hpOverflow && abilityChangesError(data, abilityChanges) === null

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error(t('levelUp.asiRequired'))
      return
    }

    startTransition(async () => {
      const res = await levelUp(character.id, campaignId, {
        hpMethod: hpChoice,
        abilityChanges,
      })

      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }

      toast.success(t('levelUp.toast.success', { level: res.newLevel, hp: res.hpGain }), {
        duration: 5000,
      })
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-[var(--bg-overlay)] p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-[calc(0.5rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--success)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">
              {t('levelUp.title', { from: data.level, to: newLevel })}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
          {/* HP choice */}
          <div>
            <label className="mb-2 block text-sm text-[var(--text-secondary)]">
              {t('levelUp.hpChoice')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHpChoice('average')}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-3 transition',
                  hpChoice === 'average'
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--border-hover)]'
                )}
              >
                <Sparkles
                  size={16}
                  className={
                    hpChoice === 'average'
                      ? 'text-[var(--accent-text)]'
                      : 'text-[var(--text-subtle)]'
                  }
                />
                <span className="mt-1 text-xs text-[var(--text-muted)]">
                  {t('levelUp.hpAverage')}
                </span>
                <span className="mt-1 text-lg font-bold text-[var(--success-text)]">
                  +{averageHP}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHpChoice('roll')}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-3 transition',
                  hpChoice === 'roll'
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--border-hover)]'
                )}
              >
                <Dices
                  size={16}
                  className={
                    hpChoice === 'roll' ? 'text-[var(--accent-text)]' : 'text-[var(--text-subtle)]'
                  }
                />
                <span className="mt-1 text-xs text-[var(--text-muted)]">{t('levelUp.hpRoll')}</span>
                <span className="mt-1 text-lg font-bold text-[var(--warning-text)]">
                  +{range.min}–{range.max}
                </span>
              </button>
            </div>
            {hpChoice === 'roll' && <p className="mt-2 text-xs text-[var(--text-muted)]">{t('levelUp.rollHint')}</p>}
            {hpOverflow && <p role="alert" className="mt-2 text-sm text-[var(--danger-text)]">{t('levelUp.hpOverflow')}</p>}
          </div>

          {/* ASI */}
          {showASI && (
            <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-subtle)]/30 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent-text)]" />
                <span className="text-sm font-medium text-[var(--accent-text)]">
                  {t('levelUp.asiTitle')}
                </span>
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAsiMode('plus2')
                    setAsiAbility1(null)
                    setAsiAbility2(null)
                  }}
                  className={cn(
                    'flex-1 rounded border px-2 py-1 text-xs transition',
                    asiMode === 'plus2'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                  )}
                >
                  {t('levelUp.asiPlus2')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAsiMode('plus1plus1'); setAsiAbility1(null); setAsiAbility2(null) }}
                  className={cn(
                    'flex-1 rounded border px-2 py-1 text-xs transition',
                    asiMode === 'plus1plus1'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-muted)]'
                  )}
                >
                  {t('levelUp.asiPlus1Plus1')}
                </button>
              </div>

              <div className="space-y-1.5">
                {ABILITIES.map((ability) => {
                  const score = data.abilities[ability]
                  const isSelected1 = asiAbility1 === ability
                  const isSelected2 = asiAbility2 === ability
                  const canSelect = score + (asiMode === 'plus2' ? 2 : 1) <= 20

                  return (
                    <button
                      key={ability}
                      type="button"
                      disabled={!canSelect}
                      onClick={() => {
                        if (asiMode === 'plus2') {
                          setAsiAbility1(isSelected1 ? null : ability)
                        } else {
                          if (isSelected1) setAsiAbility1(null)
                          else if (isSelected2) setAsiAbility2(null)
                          else if (!asiAbility1) setAsiAbility1(ability)
                          else if (!asiAbility2) setAsiAbility2(ability)
                        }
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition',
                        isSelected1 || isSelected2
                          ? 'bg-[var(--accent)]/20 text-[var(--accent-text)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                        !canSelect && 'cursor-not-allowed opacity-30'
                      )}
                    >
                      <span>{abilityLabel(lang, ability)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-[var(--text-subtle)]">{score}</span>
                        {(isSelected1 || isSelected2) && (
                          <span className="text-xs text-[var(--success-text)]">
                            → {score + (asiMode === 'plus2' ? 2 : 1)}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3 text-sm">
            <div className="mb-1 flex justify-between">
              <span className="text-[var(--text-subtle)]">HP</span>
              <span className="text-[var(--text-secondary)]">
                {data.hp.max} → {hpChoice === 'average' ? data.hp.max + averageHP : `${data.hp.max + range.min}–${data.hp.max + range.max}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-subtle)]">
                {t('characters.level', { level: '' }).trim()}
              </span>
              <span className="text-[var(--text-secondary)]">
                {data.level} → {newLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="min-h-11 rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit()}
            className="min-h-11 rounded-lg bg-[var(--success)] px-4 py-2 font-medium text-white transition hover:bg-[var(--success)]/90 disabled:opacity-50"
          >
            {isPending ? t('levelUp.submitting') : t('levelUp.submit', { level: newLevel })}
          </button>
        </div>
      </div>
    </div>
  )
}
