import type { AbilityKey, CharacterData, CharacterHP, SkillKey } from '@/lib/types'
import {
  POINT_BUY_COSTS,
  POINT_BUY_TOTAL,
  type BackgroundInfo,
  type ClassInfo,
  type RaceInfo,
} from '@/lib/dnd/constants'
import { abilityModifier } from '@/lib/dnd/formulas'
import { SKILL_ABILITY } from '@/lib/types'

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// ============================================================
// Point Buy
// ============================================================

export function getPointsSpent(abilities: Record<AbilityKey, number>): number {
  return ABILITIES.reduce((sum, ab) => sum + (POINT_BUY_COSTS[abilities[ab]] ?? 0), 0)
}

export function getPointsRemaining(abilities: Record<AbilityKey, number>): number {
  return POINT_BUY_TOTAL - getPointsSpent(abilities)
}

export function canIncrement(abilities: Record<AbilityKey, number>, ability: AbilityKey): boolean {
  const current = abilities[ability]
  if (current >= 15) return false
  const newCost = POINT_BUY_COSTS[current + 1] ?? 0
  const oldCost = POINT_BUY_COSTS[current] ?? 0
  return getPointsRemaining(abilities) >= newCost - oldCost
}

export function canDecrement(abilities: Record<AbilityKey, number>, ability: AbilityKey): boolean {
  return abilities[ability] > 8
}

// ============================================================
// Проверка стандартного массива
// ============================================================

export function isStandardArrayUsed(values: number[]): boolean {
  const sorted = [...values].sort((a, b) => b - a)
  const expected = [15, 14, 13, 12, 10, 8]
  return sorted.every((v, i) => v === expected[i])
}

// ============================================================
// Билд персонажа
// ============================================================

interface BuildInput {
  name: string
  level: number
  race: RaceInfo
  class: ClassInfo
  background: BackgroundInfo
  baseAbilities: Record<AbilityKey, number>
  chosenSkills: SkillKey[]
}

export function buildCharacterData(input: BuildInput): CharacterData {
  const { race, class: cls, level, baseAbilities, chosenSkills } = input

  // Применяем расовые бонусы
  const finalAbilities: Record<AbilityKey, number> = {
    str: baseAbilities.str + (race.abilityBonuses.str ?? 0),
    dex: baseAbilities.dex + (race.abilityBonuses.dex ?? 0),
    con: baseAbilities.con + (race.abilityBonuses.con ?? 0),
    int: baseAbilities.int + (race.abilityBonuses.int ?? 0),
    wis: baseAbilities.wis + (race.abilityBonuses.wis ?? 0),
    cha: baseAbilities.cha + (race.abilityBonuses.cha ?? 0),
  }

  // Навыки: от класса + от предыстории
  const allSkills = Array.from(new Set([...chosenSkills, ...input.background.skills]))

  // HP: hitDie + con_mod (уровень 1)
  const conMod = abilityModifier(finalAbilities.con)
  const hpMax = cls.hitDie + conMod
  const hp: CharacterHP = {
    current: hpMax,
    max: hpMax,
    temp: 0,
  }

  // AC: 10 + dex_mod
  const ac = 10 + abilityModifier(finalAbilities.dex)

  return {
    level,
    class: cls.slug,
    race: race.slug,
    background: input.background.slug,
    abilities: finalAbilities,
    proficientSkills: allSkills,
    proficientSaves: cls.savingThrows,
    hp,
    ac,
    speed: race.speed,
  }
}

// ============================================================
// Вспомогательное
// ============================================================

export function getAbilityList(): AbilityKey[] {
  return ABILITIES
}

// CHANGES (К9): удалена getSkillName() — использовала удалённый SKILL_LABELS.
// Если понадобится, используй skillLabel(lang, skill) из @/lib/i18n/labels.

export function getSkillAbility(skill: SkillKey): AbilityKey {
  return SKILL_ABILITY[skill]
}
