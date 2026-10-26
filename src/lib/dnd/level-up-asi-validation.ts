import { hasASI } from './constants'
import type { AbilityKey } from '@/lib/types'

const ABILITIES = new Set<AbilityKey>(['str', 'dex', 'con', 'int', 'wis', 'cha'])

export function validateLevelUpASI(
  newLevel: number,
  changes: unknown,
  currentAbilities?: unknown
): string | null {
  if (changes !== undefined && (changes === null || typeof changes !== 'object' || Array.isArray(changes))) {
    return 'Некорректное распределение характеристик'
  }
  const entries = Object.entries((changes ?? {}) as Record<string, unknown>)
  if (!hasASI(newLevel)) {
    return entries.length ? 'На этом уровне повышение характеристик недоступно' : null
  }
  if (entries.length < 1 || entries.length > 2) return 'Распределите 2 очка характеристик'
  let total = 0
  for (const [key, amount] of entries) {
    if (!ABILITIES.has(key as AbilityKey) || (amount !== 1 && amount !== 2)) {
      return 'Некорректное распределение характеристик'
    }
    total += amount
  }
  if (total !== 2) return 'Распределите ровно 2 очка характеристик'
  if (!currentAbilities || typeof currentAbilities !== 'object' || Array.isArray(currentAbilities)) {
    return 'Некорректные исходные характеристики'
  }
  const abilities = currentAbilities as Record<string, unknown>
  for (const [key, amount] of entries) {
    const current = abilities[key]
    if (typeof current !== 'number' || !Number.isSafeInteger(current) || current < 1 || current > 20) {
      return 'Некорректные исходные характеристики'
    }
    if (current + (amount as number) > 20) {
      return 'Характеристика не может превышать 20'
    }
  }
  return null
}
