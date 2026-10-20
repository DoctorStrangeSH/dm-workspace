'use client'

import { useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { abilityModifier, formatModifier } from '@/lib/dnd/formulas'
import {
  canDecrement,
  canIncrement,
  getPointsRemaining,
  isStandardArrayUsed,
} from '@/lib/dnd/character-builder'
import { ABILITY_LABELS, type AbilityKey } from '@/lib/types'
import { STANDARD_ARRAY } from '@/lib/dnd/constants'
import { cn } from '@/lib/utils'

interface Props {
  abilities: Record<AbilityKey, number>
  setAbilities: (abilities: Record<AbilityKey, number>) => void
}

type Mode = 'pointbuy' | 'standard'

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function WizardStep2({ abilities, setAbilities }: Props) {
  const [mode, setMode] = useState<Mode>('pointbuy')
  const [standardValues, setStandardValues] = useState<number[]>([])

  const remaining = getPointsRemaining(abilities)

  const increment = (ab: AbilityKey) => {
    if (!canIncrement(abilities, ab)) return
    setAbilities({ ...abilities, [ab]: abilities[ab] + 1 })
  }

  const decrement = (ab: AbilityKey) => {
    if (!canDecrement(abilities, ab)) return
    setAbilities({ ...abilities, [ab]: abilities[ab] - 1 })
  }

  const resetPointBuy = () => {
    setAbilities({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
  }

  const applyStandard = (values: number[]) => {
    if (values.length !== 6) return
    const newAbilities = { ...abilities }
    ABILITIES.forEach((ab, i) => {
      newAbilities[ab] = values[i] ?? 8
    })
    setAbilities(newAbilities)
  }

  return (
    <div className="space-y-6">
      {/* Режим */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('pointbuy')
            resetPointBuy()
          }}
          className={cn(
            'flex-1 rounded px-3 py-1.5 text-sm transition',
            mode === 'pointbuy' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          Point Buy (27 очков)
        </button>
        <button
          type="button"
          onClick={() => setMode('standard')}
          className={cn(
            'flex-1 rounded px-3 py-1.5 text-sm transition',
            mode === 'standard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          Стандартный массив
        </button>
      </div>

      {/* Point Buy */}
      {mode === 'pointbuy' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Осталось очков</p>
              <p className="text-2xl font-bold">
                <span className={remaining === 0 ? 'text-green-400' : 'text-amber-400'}>
                  {remaining}
                </span>
                <span className="text-base text-slate-600"> / 27</span>
              </p>
            </div>
            <button
              type="button"
              onClick={resetPointBuy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw size={14} />
              Сбросить
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ABILITIES.map((ab) => {
              const mod = abilityModifier(abilities[ab])
              return (
                <div key={ab} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <div className="mb-2 text-xs text-slate-500">{ABILITY_LABELS[ab]}</div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => decrement(ab)}
                      disabled={!canDecrement(abilities, ab)}
                      className="rounded p-1.5 transition hover:bg-slate-800 disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{abilities[ab]}</div>
                      <div className="text-xs text-slate-500">{formatModifier(mod)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => increment(ab)}
                      disabled={!canIncrement(abilities, ab)}
                      className="rounded p-1.5 transition hover:bg-slate-800 disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Стандартный массив */}
      {mode === 'standard' && (
        <>
          <div>
            <p className="mb-3 text-sm text-slate-400">
              Распредели значения: 15, 14, 13, 12, 10, 8
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {STANDARD_ARRAY.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    const next = [...standardValues, v]
                    if (next.length <= 6) {
                      setStandardValues(next)
                      applyStandard(next)
                    }
                  }}
                  disabled={standardValues.includes(v)}
                  className="rounded-lg border border-indigo-800 bg-indigo-950/60 px-3 py-1.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-900/60 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setStandardValues([])
                  resetPointBuy()
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw size={14} className="mr-1 inline" />
                Сбросить
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ABILITIES.map((ab) => {
              const mod = abilityModifier(abilities[ab])
              return (
                <div key={ab} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <div className="mb-2 text-xs text-slate-500">{ABILITY_LABELS[ab]}</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{abilities[ab]}</div>
                    <div className="text-xs text-slate-500">{formatModifier(mod)}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {!isStandardArrayUsed(Object.values(abilities)) && (
            <p className="text-xs text-amber-400">
              ⚠️ Используй все 6 значений (15, 14, 13, 12, 10, 8)
            </p>
          )}
        </>
      )}
    </div>
  )
}
