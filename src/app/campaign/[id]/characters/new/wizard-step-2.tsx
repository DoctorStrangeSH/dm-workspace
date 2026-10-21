'use client'

import { useState } from 'react'
import { Minus, Plus, RotateCcw, GripVertical, Info } from 'lucide-react'
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
import { Card, IconButton, Tooltip } from '@/components/ui'

export type AbilityMode = 'pointbuy' | 'standard'

interface Props {
  abilities: Record<AbilityKey, number>
  setAbilities: (abilities: Record<AbilityKey, number>) => void
  mode: AbilityMode
  setMode: (mode: AbilityMode) => void
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
}

/**
 * CHANGES:
 * 1. mode / setMode — props (поднято в character-wizard.tsx).
 * 2. Стандартный массив: drag-and-drop + click-to-select.
 * 3. selectedValue — выбранное значение (click-to-select), сбрасывается после drop.
 * 4. Правильный подсчёт использованных значений: учитываем 8 как валидное.
 * 5. Tooltip модификатора.
 */
export default function WizardStep2({ abilities, setAbilities, mode, setMode }: Props) {
  // Выбранное значение (для click-to-select)
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  // Перетаскиваемое значение (для drag-and-drop)
  const [draggedValue, setDraggedValue] = useState<number | null>(null)
  const [draggedFrom, setDraggedFrom] = useState<AbilityKey | null>(null)

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

  const switchToStandard = () => {
    setMode('standard')
    setAbilities({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
    setSelectedValue(null)
    setDraggedValue(null)
    setDraggedFrom(null)
  }

  const switchToPointBuy = () => {
    setMode('pointbuy')
    resetPointBuy()
    setSelectedValue(null)
    setDraggedValue(null)
    setDraggedFrom(null)
  }

  // ─── Подсчёт использованных значений в стандартном массиве ───
  // ВАЖНО: 8 — дефолт, но 8 может быть валидным значением (из STANDARD_ARRAY).
  // Поэтому считаем все 6 характеристик, и каждое значение сравниваем с STANDARD_ARRAY.
  const usedValues = ABILITIES.map((ab) => abilities[ab])
  const usedCounts = usedValues.reduce<Record<number, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})

  const availableValues = STANDARD_ARRAY.filter((v) => {
    const maxCount = STANDARD_ARRAY.filter((sv) => sv === v).length
    const usedCount = usedCounts[v] ?? 0
    return usedCount < maxCount
  })

  // ─── Drop ───
  const handleDrop = (targetAbility: AbilityKey) => {
    const value = draggedValue ?? selectedValue
    if (value === null) return

    // Если перетащили с другой характеристики — меняем местами
    if (draggedFrom && draggedFrom !== targetAbility) {
      const fromValue = abilities[draggedFrom]
      const toValue = abilities[targetAbility]
      setAbilities({
        ...abilities,
        [draggedFrom]: toValue,
        [targetAbility]: fromValue,
      })
    } else {
      // Иначе — ставим значение
      setAbilities({ ...abilities, [targetAbility]: value })
    }

    setSelectedValue(null)
    setDraggedValue(null)
    setDraggedFrom(null)
  }

  const handleDragStart = (value: number, from: AbilityKey | null) => {
    setDraggedValue(value)
    setDraggedFrom(from)
    setSelectedValue(null)
  }

  const handleDragEnd = () => {
    setDraggedValue(null)
    setDraggedFrom(null)
  }

  // ─── Click-to-select ───
  const handleValueClick = (value: number) => {
    if (selectedValue === value) {
      setSelectedValue(null) // повторный клик — снять выбор
    } else {
      setSelectedValue(value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Переключатель режима */}
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
        <button
          type="button"
          onClick={switchToPointBuy}
          className={cn(
            'flex-1 rounded px-3 py-1.5 text-sm transition-colors',
            mode === 'pointbuy'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          Point Buy (27 очков)
        </button>
        <button
          type="button"
          onClick={switchToStandard}
          className={cn(
            'flex-1 rounded px-3 py-1.5 text-sm transition-colors',
            mode === 'standard'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          Стандартный массив
        </button>
      </div>

      {/* ─── POINT BUY ─── */}
      {mode === 'pointbuy' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Осталось очков</p>
              <p className="text-2xl font-bold">
                <span
                  className={
                    remaining === 0
                      ? 'text-[var(--success)]'
                      : remaining < 0
                        ? 'text-[var(--danger)]'
                        : 'text-[var(--warning-text)]'
                  }
                >
                  {remaining}
                </span>
                <span className="text-base text-[var(--text-subtle)]"> / 27</span>
              </p>
            </div>
            <IconButton variant="ghost" size="sm" label="Сбросить" onClick={resetPointBuy}>
              <RotateCcw size={14} />
            </IconButton>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ABILITIES.map((ab) => {
              const score = abilities[ab]
              const mod = abilityModifier(score)
              const canInc = canIncrement(abilities, ab)
              const canDec = canDecrement(abilities, ab)
              return (
                <Card key={ab} padding="sm">
                  <div className="mb-2 text-xs text-[var(--text-subtle)]">{ABILITY_LABELS[ab]}</div>
                  <div className="flex items-center justify-between gap-2">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      label={`Уменьшить ${ABILITY_NAMES[ab]}`}
                      onClick={() => decrement(ab)}
                      disabled={!canDec}
                    >
                      <Minus size={14} />
                    </IconButton>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{score}</div>
                      <Tooltip
                        content={`Модификатор: ${formatModifier(mod)}. Влияет на броски, урон, спасброски`}
                      >
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium',
                            mod >= 0
                              ? 'bg-[var(--success-subtle)] text-[var(--success-text)]'
                              : 'bg-[var(--danger-subtle)] text-[var(--danger-text)]'
                          )}
                        >
                          {formatModifier(mod)}
                          <Info size={10} className="opacity-60" />
                        </span>
                      </Tooltip>
                    </div>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      label={`Увеличить ${ABILITY_NAMES[ab]}`}
                      onClick={() => increment(ab)}
                      disabled={!canInc}
                    >
                      <Plus size={14} />
                    </IconButton>
                  </div>
                </Card>
              )
            })}
          </div>

          <p className="text-xs text-[var(--text-subtle)]">
            Правила: 8–13 = 1 очко за шаг, 14–15 = 2 очка за шаг. Максимум 15 до расовых бонусов.
          </p>

          {remaining === 0 && (
            <p className="text-xs text-[var(--success)]">
              ✓ Все очки потрачены. Можно идти дальше.
            </p>
          )}
        </>
      )}

      {/* ─── STANDARD ARRAY ─── */}
      {mode === 'standard' && (
        <>
          <div>
            <p className="mb-3 text-sm text-[var(--text-muted)]">
              Перетащи значения на характеристики, или нажми на значение → потом на характеристику:
            </p>

            {/* Доступные значения */}
            <div className="mb-4 flex flex-wrap gap-2">
              {STANDARD_ARRAY.map((v) => {
                const isUsed = !availableValues.includes(v)
                const isSelected = selectedValue === v
                return (
                  <button
                    key={v}
                    type="button"
                    draggable={!isUsed}
                    onDragStart={() => handleDragStart(v, null)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isUsed && handleValueClick(v)}
                    disabled={isUsed}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/40'
                        : isUsed
                          ? 'cursor-not-allowed border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-subtle)] opacity-40'
                          : 'cursor-grab border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)] hover:bg-[var(--accent)]/20 active:cursor-grabbing'
                    )}
                  >
                    {v}
                  </button>
                )
              })}
              <IconButton
                variant="ghost"
                size="sm"
                label="Сбросить"
                onClick={() => {
                  setAbilities({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
                  setSelectedValue(null)
                }}
              >
                <RotateCcw size={14} />
              </IconButton>
            </div>

            {selectedValue !== null && (
              <p className="mb-3 text-xs text-[var(--accent-text)]">
                Выбрано значение <strong>{selectedValue}</strong>. Кликни на характеристику, чтобы
                присвоить.
              </p>
            )}
          </div>

          {/* Характеристики */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ABILITIES.map((ab) => {
              const value = abilities[ab]
              const mod = abilityModifier(value)
              const isDefault = value === 8 && !STANDARD_ARRAY.includes(8)
              const isTarget =
                (draggedValue !== null || selectedValue !== null) && draggedFrom !== ab

              return (
                <Card
                  key={ab}
                  padding="sm"
                  className={cn(
                    'transition-colors',
                    isTarget &&
                      'cursor-pointer border-[var(--accent)]/50 hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)]/20',
                    draggedFrom === ab && 'opacity-50'
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleDrop(ab)
                  }}
                  onClick={() => {
                    if (draggedValue !== null || selectedValue !== null) {
                      handleDrop(ab)
                    }
                  }}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-subtle)]">
                    <span>{ABILITY_LABELS[ab]}</span>
                    {!isDefault && value !== 8 && (
                      <span
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          handleDragStart(value, ab)
                        }}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab text-[var(--text-subtle)] active:cursor-grabbing"
                        aria-label={`Перетащи ${ABILITY_NAMES[ab]}`}
                      >
                        <GripVertical size={12} />
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        value === 8 ? 'text-[var(--text-subtle)]' : 'text-[var(--text-primary)]'
                      )}
                    >
                      {value}
                    </div>
                    <Tooltip content={`Модификатор: ${formatModifier(mod)}`}>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium',
                          mod >= 0
                            ? 'bg-[var(--success-subtle)] text-[var(--success-text)]'
                            : 'bg-[var(--danger-subtle)] text-[var(--danger-text)]'
                        )}
                      >
                        {formatModifier(mod)}
                        <Info size={10} className="opacity-60" />
                      </span>
                    </Tooltip>
                  </div>
                </Card>
              )
            })}
          </div>

          {isStandardArrayUsed(Object.values(abilities)) ? (
            <p className="text-xs text-[var(--success)]">
              ✓ Стандартный массив использован. Можно идти дальше.
            </p>
          ) : (
            <p className="text-xs text-[var(--warning-text)]">
              ⚠️ Используй все 6 значений (15, 14, 13, 12, 10, 8). Осталось:{' '}
              {availableValues.join(', ') || '—'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
