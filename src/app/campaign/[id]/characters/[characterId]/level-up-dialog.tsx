'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, Dices, Sparkles } from 'lucide-react'
import { levelUp } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import {
  getAverageHP,
  rollHP,
  canLevelUp,
} from '@/lib/dnd/level-up'
import {
  abilityModifier,
} from '@/lib/dnd/formulas'
import { hasASI } from '@/lib/dnd/constants'
import {
  ABILITY_LABELS,
  type AbilityKey,
  type Character,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  character: Character
  campaignId: string
  onClose: () => void
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

type HPChoice = 'average' | 'roll'
type ASIMode = 'plus2' | 'plus1plus1'

export default function LevelUpDialog({
  character,
  campaignId,
  onClose,
}: Props) {
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-slate-300 mb-4">Максимальный уровень достигнут</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
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

      toast.success(
        `Уровень ${res.newLevel}! +${res.hpGain} HP`,
        { duration: 5000 }
      )
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full my-auto">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" />
            <h2 className="font-semibold">
              Уровень {data.level} → {newLevel}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-slate-800 rounded transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* HP */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              HP (выбери способ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHpChoice('average')}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border transition',
                  hpChoice === 'average'
                    ? 'bg-indigo-950/60 border-indigo-600'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                )}
              >
                <Sparkles
                  size={16}
                  className={hpChoice === 'average' ? 'text-indigo-400' : 'text-slate-500'}
                />
                <span className="text-xs mt-1 text-slate-400">Среднее</span>
                <span className="text-lg font-bold mt-1 text-green-400">
                  +{averageHP}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHpChoice('roll')}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border transition',
                  hpChoice === 'roll'
                    ? 'bg-indigo-950/60 border-indigo-600'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                )}
              >
                <Dices
                  size={16}
                  className={hpChoice === 'roll' ? 'text-indigo-400' : 'text-slate-500'}
                />
                <span className="text-xs mt-1 text-slate-400">Ролл</span>
                <span className="text-lg font-bold mt-1 text-amber-400">
                  ~{rolledHP}
                </span>
              </button>
            </div>
          </div>

          {/* ASI */}
          {showASI && (
            <div className="bg-violet-950/30 border border-violet-900/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-sm font-medium text-violet-300">
                  Улучшение характеристик
                </span>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAsiMode('plus2')
                    setAsiAbility2(null)
                  }}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs rounded border transition',
                    asiMode === 'plus2'
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  )}
                >
                  +2 к одной
                </button>
                <button
                  type="button"
                  onClick={() => setAsiMode('plus1plus1')}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs rounded border transition',
                    asiMode === 'plus1plus1'
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
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
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition',
                        isSelected1 || isSelected2
                          ? 'bg-violet-950/60 text-violet-200'
                          : 'hover:bg-slate-800 text-slate-400',
                        !canSelect && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <span>{ABILITY_LABELS[ability]}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">{score}</span>
                        {(isSelected1 || isSelected2) && (
                          <span className="text-green-400 text-xs">
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
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-1">
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

        <div className="flex gap-3 p-4 border-t border-slate-800 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit()}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition disabled:opacity-50 font-medium"
          >
            {isPending ? 'Повышаем...' : `Повысить до ${newLevel}`}
          </button>
        </div>
      </div>
    </div>
  )
}