'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, Dices, Sparkles } from 'lucide-react'
import { levelUp } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { getAverageHP, rollHP, canLevelUp } from '@/lib/dnd/level-up'
import { abilityModifier } from '@/lib/dnd/formulas'
import { hasASI } from '@/lib/dnd/constants'
import { ABILITY_LABELS, type AbilityKey, type Character } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  character: Character
  campaignId: string
  onClose: () => void
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

type HPChoice = 'average' | 'roll'
type ASIMode = 'plus2' | 'plus1plus1'

export default function LevelUpDialog({ character, campaignId, onClose }: Props) {
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
  const rolledHP = rollHP(data.class, conMod)

  if (!canLevelUp(data)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <p className="mb-4 text-slate-300">Максимальный уровень достигнут</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    )
  }

  const canSubmit = () => {
    if (!showASI) return true
    if (asiMode === 'plus2') return !!asiAbility1
    return !!asiAbility1 && !!asiAbility2 && asiAbility1 !== asiAbility2
  }

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error('Заполните ASI')
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
        toast.error(res.error ?? 'Ошибка')
        return
      }

      toast.success(`Уровень ${res.newLevel}! +${res.hpGain} HP`, { duration: 5000 })
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" />
            <h2 className="font-semibold">
              Уровень {data.level} → {newLevel}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded p-1 transition hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* HP */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">HP (выбери способ)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHpChoice('average')}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-3 transition',
                  hpChoice === 'average'
                    ? 'border-indigo-600 bg-indigo-950/60'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                )}
              >
                <Sparkles
                  size={16}
                  className={hpChoice === 'average' ? 'text-indigo-400' : 'text-slate-500'}
                />
                <span className="mt-1 text-xs text-slate-400">Среднее</span>
                <span className="mt-1 text-lg font-bold text-green-400">+{averageHP}</span>
              </button>
              <button
                type="button"
                onClick={() => setHpChoice('roll')}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-3 transition',
                  hpChoice === 'roll'
                    ? 'border-indigo-600 bg-indigo-950/60'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                )}
              >
                <Dices
                  size={16}
                  className={hpChoice === 'roll' ? 'text-indigo-400' : 'text-slate-500'}
                />
                <span className="mt-1 text-xs text-slate-400">Ролл</span>
                <span className="mt-1 text-lg font-bold text-amber-400">~{rolledHP}</span>
              </button>
            </div>
          </div>

          {/* ASI */}
          {showASI && (
            <div className="rounded-lg border border-violet-900/50 bg-violet-950/30 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-sm font-medium text-violet-300">Улучшение характеристик</span>
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAsiMode('plus2')
                    setAsiAbility2(null)
                  }}
                  className={cn(
                    'flex-1 rounded border px-2 py-1 text-xs transition',
                    asiMode === 'plus2'
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  )}
                >
                  +2 к одной
                </button>
                <button
                  type="button"
                  onClick={() => setAsiMode('plus1plus1')}
                  className={cn(
                    'flex-1 rounded border px-2 py-1 text-xs transition',
                    asiMode === 'plus1plus1'
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  )}
                >
                  +1 к двум
                </button>
              </div>

              <div className="space-y-1.5">
                {ABILITIES.map((ability) => {
                  const score = data.abilities[ability]
                  const isSelected1 = asiAbility1 === ability
                  const isSelected2 = asiAbility2 === ability
                  const canSelect = score < 20

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
                          ? 'bg-violet-950/60 text-violet-200'
                          : 'text-slate-400 hover:bg-slate-800',
                        !canSelect && 'cursor-not-allowed opacity-30'
                      )}
                    >
                      <span>{ABILITY_LABELS[ability]}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">{score}</span>
                        {(isSelected1 || isSelected2) && (
                          <span className="text-xs text-green-400">
                            +{asiMode === 'plus2' ? 2 : 1}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Сводка */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
            <div className="mb-1 flex justify-between">
              <span className="text-slate-500">HP</span>
              <span className="text-slate-300">
                {data.hp.max} → {data.hp.max + (hpChoice === 'average' ? averageHP : 0)}+
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Уровень</span>
              <span className="text-slate-300">
                {data.level} → {newLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit()}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium transition hover:bg-green-500 disabled:opacity-50"
          >
            {isPending ? 'Повышаем...' : `Повысить до ${newLevel}`}
          </button>
        </div>
      </div>
    </div>
  )
}
