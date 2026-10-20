import type { AbilityKey, CharacterData, SkillKey } from '@/lib/types'
import { SKILL_ABILITY } from '@/lib/types'

/**
 * Модификатор характеристики: floor((score - 10) / 2).
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Бонус мастерства по уровню.
 * Level 1-4: +2, 5-8: +3, 9-12: +4, 13-16: +5, 17-20: +6.
 */
export function proficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2
}

/**
 * Модификатор характеристики по ключу.
 */
export function getAbilityMod(data: CharacterData, ability: AbilityKey): number {
  return abilityModifier(data.abilities[ability] ?? 10)
}

/**
 * Бонус спасброска.
 */
export function getSaveBonus(data: CharacterData, ability: AbilityKey): number {
  const mod = getAbilityMod(data, ability)
  const prof = data.proficientSaves?.includes(ability) ? proficiencyBonus(data.level) : 0
  return mod + prof
}

/**
 * Бонус навыка.
 */
export function getSkillBonus(data: CharacterData, skill: SkillKey): number {
  const ability = SKILL_ABILITY[skill]
  const mod = getAbilityMod(data, ability)
  const prof = data.proficientSkills?.includes(skill) ? proficiencyBonus(data.level) : 0
  return mod + prof
}

/**
 * Модификатор инициативы.
 */
export function getInitiative(data: CharacterData): number {
  return getAbilityMod(data, 'dex')
}

/**
 * Пассивная внимательность.
 */
export function getPassivePerception(data: CharacterData): number {
  return 10 + getSkillBonus(data, 'perception')
}

/**
 * Форматированный модификатор: "+3", "-1", "0".
 */
export function formatModifier(mod: number): string {
  if (mod >= 0) return `+${mod}`
  return `${mod}`
}

/**
 * Парсит выражение броска.
 * Возвращает: { count, sides, modifier, adv/dis, keepHighest/keepLowest }.
 *
 * Примеры:
 * "1d20+5" → { count: 1, sides: 20, modifier: 5 }
 * "2d6+2" → { count: 2, sides: 6, modifier: 2 }
 * "4d6kh3" → { count: 4, sides: 6, keepHighest: 3 }
 * "1d20adv" → { count: 1, sides: 20, advantage: true }
 */
export interface DiceExpression {
  count: number
  sides: number
  modifier: number
  advantage?: boolean
  disadvantage?: boolean
  keepHighest?: number
  keepLowest?: number
}

export function parseDice(expr: string): DiceExpression | null {
  let str = expr.toLowerCase().trim()

  // Advantage / Disadvantage
  let advantage = false
  let disadvantage = false
  if (str.includes('adv')) {
    advantage = true
    str = str.replace('adv', '')
  }
  if (str.includes('dis')) {
    disadvantage = true
    str = str.replace('dis', '')
  }

  // Keep highest / lowest
  let keepHighest: number | undefined
  let keepLowest: number | undefined
  const khMatch = str.match(/kh(\d+)/)
  const klMatch = str.match(/kl(\d+)/)
  if (khMatch) {
    keepHighest = parseInt(khMatch[1], 10)
    str = str.replace(khMatch[0], '')
  }
  if (klMatch) {
    keepLowest = parseInt(klMatch[1], 10)
    str = str.replace(klMatch[0], '')
  }

  // Основное: XdY+Z
  const match = str.match(/^(\d+)d(\d+)([+-]\d+)?$/)
  if (!match) return null

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
    advantage,
    disadvantage,
    keepHighest,
    keepLowest,
  }
}

/**
 * Бросает кости по выражению.
 */
export function rollDice(expr: DiceExpression): {
  rolls: number[]
  total: number
  expression: string
} {
  const rolls: number[] = []

  for (let i = 0; i < expr.count; i++) {
    rolls.push(Math.floor(Math.random() * expr.sides) + 1)
  }

  let selectedRolls = [...rolls]

  // Keep highest
  if (expr.keepHighest !== undefined) {
    selectedRolls = [...rolls].sort((a, b) => b - a).slice(0, expr.keepHighest)
  }

  // Keep lowest
  if (expr.keepLowest !== undefined) {
    selectedRolls = [...rolls].sort((a, b) => a - b).slice(0, expr.keepLowest)
  }

  // Advantage / disadvantage (только для d20)
  if ((expr.advantage || expr.disadvantage) && expr.sides === 20 && expr.count === 1) {
    const roll2 = Math.floor(Math.random() * 20) + 1
    rolls.push(roll2)
    if (expr.advantage) {
      selectedRolls = [Math.max(rolls[0], roll2)]
    } else {
      selectedRolls = [Math.min(rolls[0], roll2)]
    }
  }

  const sum = selectedRolls.reduce((a, b) => a + b, 0)
  const total = sum + expr.modifier

  return {
    rolls: selectedRolls,
    total,
    expression: exprToDisplay(expr),
  }
}

function exprToDisplay(expr: DiceExpression): string {
  let s = `${expr.count}d${expr.sides}`
  if (expr.keepHighest !== undefined) s += `kh${expr.keepHighest}`
  if (expr.keepLowest !== undefined) s += `kl${expr.keepLowest}`
  if (expr.advantage) s += 'adv'
  if (expr.disadvantage) s += 'dis'
  if (expr.modifier > 0) s += `+${expr.modifier}`
  if (expr.modifier < 0) s += `${expr.modifier}`
  return s
}
