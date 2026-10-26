'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, Dices, Sparkles } from 'lucide-react'
import { levelUp } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { getAverageHP, canLevelUp } from '@/lib/dnd/level-up'
import { abilityModifier } from '@/lib/dnd/formulas'
import { CLASSES, hasASI } from '@/lib/dnd/constants'
import { validCharacterHP } from '@/lib/dnd/valid-character-hp'
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
  const newLevel = data.level + 1
  const showASI = hasASI(newLevel)
  const conMod = abilityModifier(data.abilities.con)

  const [hpChoice, setHpChoice] = useState<HPChoice>('average')
  const [asiMode, setAsiMode] = useState<ASIMode>('plus2')
  const [asiAbility1, setAsiAbility1] = useState<AbilityKey | null>(null)
  const [asiAbility2, setAsiAbility2] = useState<AbilityKey | null>(null)

  const averageHP = getAverageHP(data.class, conMod)
  const hitDie = CLASSES.find((cls) => cls.slug === data.class)?.hitDie
  const hp = validCharacterHP(data.hp)
  const minGain = Math.max(1, 1 + conMod)
  const maxGain = hitDie ? Math.max(1, hitDie + conMod) : null
  const canPreviewHP = hp !== null && hitDie !== undefined
  const predictedMaxHP = hp && canPreviewHP && hpChoice === 'average' ? hp.max + averageHP : null

  if (!canLevelUp(data)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="mb-4 text-[var(--text-secondary)]">{t('levelUp.maxLevelReached')}</p>
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

  const isEligibleASI = (ability: AbilityKey, amount: number) =>
    Number.isSafeInteger(data.abilities[ability]) && data.abilities[ability] + amount <= 20

  const canSubmit = () => {
    if (!showASI) return true
    if (asiMode === 'plus2') return !!asiAbility1 && isEligibleASI(asiAbility1, 2)
    return !!asiAbility1 && !!asiAbility2 && asiAbility1 !== asiAbility2 &&
      isEligibleASI(asiAbility1, 1) && isEligibleASI(asiAbility2, 1)
  }

  const handleSubmit = () => {
    if (!hp) {
      toast.error(lang === 'en' ? 'Character HP is invalid' : 'Некорректные значения HP персонажа')
      return
    }
    if (hitDie === undefined) {
      toast.error(lang === 'en' ? 'Select a valid base class before leveling up' : 'Укажите основной класс персонажа перед повышением уровня')
      return
    }
    if (!canSubmit()) {
      toast.error(t('levelUp.asiRequired'))
      return
    }

    const abilityChanges: Partial<Record<string, number>> = {}
    if (showASI) {
      if (asiMode === 'plus2' && asiAbility1) {
        abilityChanges[asiAbility1] = 2
      } else if (asiMode === 'plus1plus1' && asiAbility1 && asiAbility2) {
        abilityChanges[asiAbility1] = 1
        abilityChanges[asiAbility2] = 1
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
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

        <div className="space-y-4 p-4">
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
                  {hitDie ? `1d${hitDie}${conMod >= 0 ? '+' : ''}${conMod}` : '—'}
                </span>
              </button>
            </div>
          </div>

          {!canPreviewHP && (
            <p role="alert" className="text-sm text-[var(--danger-text)]">
              {!hp
                ? (lang === 'en' ? 'Cannot level up: invalid hit points.' : 'Невозможно повысить уровень: некорректные HP.')
                : (lang === 'en' ? 'Cannot level up: base class is not recognized.' : 'Невозможно повысить уровень: основной класс не распознан.')}
            </p>
          )}
          {canPreviewHP && hp && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3"
              aria-live="polite">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {lang === 'en' ? 'HP after level up' : 'HP после повышения уровня'}
              </p>
              {predictedMaxHP !== null ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {hp.max} → <strong>{predictedMaxHP}</strong> {lang === 'en' ? 'max HP' : 'макс. HP'}
                  {' · '}{lang === 'en' ? 'current HP will equal the new maximum' : 'Текущие HP станут равны новому максимуму'}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {lang === 'en'
                    ? `Current max: ${hp.max}. The new maximum depends on a random roll (${minGain}–${maxGain}).`
                    : `Текущий максимум: ${hp.max}. Новый максимум зависит от броска кубика (прибавка ${minGain}–${maxGain}).`}
                </p>
              )}
            </div>
          )}

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
                    setAsiAbility2(null)
                    setAsiAbility1(null)
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
                  const canSelect = Number.isSafeInteger(score) && score + (asiMode === 'plus2' ? 2 : 1) <= 20

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
                          <span className="font-semibold text-[var(--success-text)]">→ {score + (asiMode === 'plus2' ? 2 : 1)}</span>
                        )}
                        {(isSelected1 || isSelected2) && (
                          <span className="text-xs text-[var(--success-text)]">
                            +{asiMode === 'plus2' ? 2 : 1}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p aria-live="polite" className="mt-2 text-xs text-[var(--text-muted)]">
                {asiMode === 'plus2'
                  ? (asiAbility1 ? `${abilityLabel(lang, asiAbility1)}: ${data.abilities[asiAbility1]} → ${data.abilities[asiAbility1] + 2}` : 'Выберите характеристику для +2')
                  : (asiAbility1 && asiAbility2
                    ? `${abilityLabel(lang, asiAbility1)}: ${data.abilities[asiAbility1]} → ${data.abilities[asiAbility1] + 1}; ${abilityLabel(lang, asiAbility2)}: ${data.abilities[asiAbility2]} → ${data.abilities[asiAbility2] + 1}`
                    : 'Выберите две разные характеристики для +1')}
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3 text-sm">
            <div className="mb-1 flex justify-between">
              <span className="text-[var(--text-subtle)]">HP</span>
              <span className="text-[var(--text-secondary)]">
                {hp ? hp.max : '—'} → {hp && canPreviewHP
                  ? hpChoice === 'average'
                    ? hp.max + averageHP
                    : `${hp.max + minGain}–${hp.max + (maxGain ?? minGain)}`
                  : '—'}
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

        <div className="flex justify-end gap-3 border-t border-[var(--border-default)] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit() || !canPreviewHP}
            className="rounded-lg bg-[var(--success)] px-4 py-2 font-medium text-white transition hover:bg-[var(--success)]/90 disabled:opacity-50"
          >
            {isPending ? t('levelUp.submitting') : t('levelUp.submit', { level: newLevel })}
          </button>
        </div>
      </div>
    </div>
  )
}
