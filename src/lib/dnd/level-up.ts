import type { AbilityKey, CharacterData } from '@/lib/types'
import { CLASSES, hasASI } from '@/lib/dnd/constants'
import { getSpellSlotsForLevel } from '@/lib/dnd/spell-slots'
import { MAX_CHARACTER_HP, characterDataHasValidHP } from '@/lib/dnd/character-hp'
import { abilityModifier } from '@/lib/dnd/formulas'
import { isSubclassForClass } from '@/lib/dnd/srd-class-utils'

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const LEVEL_UP_ERRORS = {
  level: 'Некорректный уровень персонажа: нужно целое число от 1 до 20.',
  maxLevel: 'Максимальный уровень — 20',
  class: 'Выберите основной класс и совместимый подкласс перед повышением уровня.',
  hp: 'Исправьте HP персонажа перед повышением уровня.',
  abilities: 'Характеристики должны быть целыми числами от 1 до 30.',
} as const
export type LevelUpIssue = keyof typeof LEVEL_UP_ERRORS

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function getLevelUpIssue(value: unknown): LevelUpIssue | null {
  if (
    !record(value) ||
    !Number.isInteger(value.level) ||
    (value.level as number) < 1 ||
    (value.level as number) > 20
  )
    return 'level'
  if (value.level === 20) return 'maxLevel'
  if (
    !CLASSES.some((c) => c.slug === value.class) ||
    (value.subclass !== undefined && !isSubclassForClass(value.subclass, value.class))
  )
    return 'class'
  if (!characterDataHasValidHP(value)) return 'hp'
  const abilities = value.abilities
  if (
    !record(abilities) ||
    ABILITIES.some(
      (key) =>
        !Number.isInteger(abilities[key]) ||
        (abilities[key] as number) < 1 ||
        (abilities[key] as number) > 30
    )
  )
    return 'abilities'
  return null
}

function validConMod(value: number) {
  return Number.isInteger(value) && value >= -5 && value <= 10
}

/** Average gain; invalid inputs cannot yield NaN or consume randomness. */
export function getAverageHP(classSlug: string, conMod: number): number {
  const cls = CLASSES.find((c) => c.slug === classSlug)
  if (!cls || !validConMod(conMod)) return 0
  return Math.max(1, Math.floor(cls.hitDie / 2) + 1 + conMod)
}

export function getHPGainRange(
  classSlug: string,
  conMod: number
): { min: number; max: number } | null {
  const cls = CLASSES.find((c) => c.slug === classSlug)
  if (!cls || !validConMod(conMod)) return null
  return { min: Math.max(1, 1 + conMod), max: Math.max(1, cls.hitDie + conMod) }
}

/** Only the server calls this for a submitted, validated request. */
export function rollHP(
  classSlug: string,
  conMod: number,
  random: () => number = Math.random
): number {
  const cls = CLASSES.find((c) => c.slug === classSlug)
  if (!cls || !validConMod(conMod)) return 0
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError('Некорректный результат броска HP')
  return Math.max(1, Math.floor(value * cls.hitDie) + 1 + conMod)
}

export function canLevelUp(data: unknown): boolean {
  return getLevelUpIssue(data) === null
}

/** Mirrors the app's existing ASI schedule; feats/class-specific progression are separate work. */
export function abilityChangesError(data: CharacterData, changes: unknown): string | null {
  if (changes === undefined) changes = {}
  if (!record(changes)) return 'Некорректные изменения характеристик'
  const entries = Object.entries(changes)
  if (
    entries.some(
      ([key, delta]) =>
        !ABILITIES.includes(key as AbilityKey) ||
        !Number.isInteger(delta) ||
        (delta as number) < 0 ||
        (delta as number) > 2
    )
  )
    return 'Допустимы только известные характеристики и целые прибавки от 0 до 2'
  const total = entries.reduce((sum, [, delta]) => sum + (delta as number), 0)
  if (hasASI(data.level + 1) ? total !== 2 : total !== 0)
    return 'На уровне ASI распределите ровно 2 очка; на остальных уровнях прибавки недоступны'
  if (
    entries.some(
      ([key, delta]) =>
        (delta as number) > 0 && data.abilities[key as AbilityKey] + (delta as number) > 20
    )
  )
    return 'Улучшение не может повысить характеристику выше 20'
  return null
}

export function applyLevelUp(
  data: CharacterData,
  hpGain: number,
  abilityChanges?: Partial<Record<string, number>>
): CharacterData {
  const issue = getLevelUpIssue(data)
  if (issue) throw new RangeError(LEVEL_UP_ERRORS[issue])
  const asiError = abilityChangesError(data, abilityChanges)
  if (asiError) throw new RangeError(asiError)
  const range = getHPGainRange(data.class, abilityModifier(data.abilities.con))!
  if (
    !Number.isInteger(hpGain) ||
    hpGain < range.min ||
    hpGain > range.max ||
    data.hp.max > MAX_CHARACTER_HP - hpGain
  )
    throw new RangeError('Некорректный прирост HP или переполнение максимума HP')
  const newLevel = data.level + 1
  const newHPMax = data.hp.max + hpGain
  const newAbilities = { ...data.abilities }
  for (const [key, delta] of Object.entries(abilityChanges ?? {}))
    newAbilities[key as AbilityKey] += delta!
  return {
    ...data,
    level: newLevel,
    abilities: newAbilities,
    hp: { ...data.hp, current: newHPMax, max: newHPMax },
    spellSlots: getSpellSlotsForLevel(data.class, newLevel),
  }
}

/** Validate every submitted field before drawing a die or preparing a database write. */
export function prepareLevelUp(
  data: CharacterData,
  options: unknown,
  random: () => number = Math.random
): { data: CharacterData; hpGain: number } | { error: string } {
  const issue = getLevelUpIssue(data)
  if (issue) return { error: LEVEL_UP_ERRORS[issue] }
  if (
    !record(options) ||
    Object.keys(options).some((key) => !['hpMethod', 'abilityChanges'].includes(key)) ||
    !['average', 'roll'].includes(options.hpMethod as string)
  )
    return { error: 'Выберите допустимый способ прироста HP' }
  const asiError = abilityChangesError(data, options.abilityChanges)
  if (asiError) return { error: asiError }
  const conMod = abilityModifier(data.abilities.con)
  const average = getAverageHP(data.class, conMod)
  const range = getHPGainRange(data.class, conMod)!
  // Refuse a roll if any possible outcome overflows, before consuming randomness.
  const upperGain = options.hpMethod === 'roll' ? range.max : average
  if (data.hp.max > MAX_CHARACTER_HP - upperGain)
    return { error: 'Максимальные HP после повышения уровня слишком велики' }
  const hpGain = options.hpMethod === 'roll' ? rollHP(data.class, conMod, random) : average
  return {
    data: applyLevelUp(
      data,
      hpGain,
      options.abilityChanges as Partial<Record<string, number>> | undefined
    ),
    hpGain,
  }
}
