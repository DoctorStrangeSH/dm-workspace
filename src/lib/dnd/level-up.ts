import type { CharacterData } from '@/lib/types'
import { CLASSES } from '@/lib/dnd/constants'
import { getSpellSlotsForLevel } from '@/lib/dnd/spell-slots'

/**
 * Возвращает среднее HP при повышении уровня (D&D правило: average).
 * floor(hitDie / 2) + 1 + con_mod.
 */
export function getAverageHP(classSlug: string, conMod: number): number {
  const cls = CLASSES.find((c) => c.slug === classSlug)
  if (!cls) return 0

  const average = Math.floor(cls.hitDie / 2) + 1
  return Math.max(1, average + conMod)
}

/**
 * Ролл HP при повышении уровня.
 */
export function rollHP(classSlug: string, conMod: number): number {
  const cls = CLASSES.find((c) => c.slug === classSlug)
  if (!cls) return 0

  const roll = Math.floor(Math.random() * cls.hitDie) + 1
  return Math.max(1, roll + conMod)
}

/**
 * Проверка: можно ли повысить уровень.
 */
export function canLevelUp(data: CharacterData): boolean {
  return data.level < 20
}

/**
 * Формирует обновленный CharacterData после level-up.
 */
export function applyLevelUp(
  data: CharacterData,
  hpGain: number,
  abilityChanges?: Partial<Record<string, number>>
): CharacterData {
  const newLevel = data.level + 1

  // HP
  const newHPMax = data.hp.max + hpGain
  const newHP = {
    ...data.hp,
    current: newHPMax,
    max: newHPMax,
  }

  // Abilities (ASI)
  const newAbilities = { ...data.abilities }
  if (abilityChanges) {
    for (const [key, delta] of Object.entries(abilityChanges)) {
      const abilityKey = key as keyof typeof newAbilities
      newAbilities[abilityKey] = Math.min(20, (newAbilities[abilityKey] ?? 10) + (delta ?? 0))
    }
  }

  // Spell slots
  const newSlots = getSpellSlotsForLevel(data.class, newLevel)

  return {
    ...data,
    level: newLevel,
    abilities: newAbilities,
    hp: newHP,
    spellSlots: newSlots,
  }
}
