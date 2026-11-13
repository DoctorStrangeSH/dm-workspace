import type { AbilityKey, SkillKey } from '@/lib/types'

const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

/** A starting suggestion, before species bonuses; every point-buy score spends 27. */
export function suggestedAbilities(
  primary: AbilityKey | AbilityKey[],
  mode: 'pointbuy' | 'standard'
) {
  const priority = [
    ...new Set([...(Array.isArray(primary) ? primary : [primary]), 'con', 'dex', ...abilities]),
  ] as AbilityKey[]
  const values = mode === 'standard' ? [15, 14, 13, 12, 10, 8] : [15, 14, 14, 10, 10, 8]
  return Object.fromEntries(priority.map((key, index) => [key, values[index]])) as Record<
    AbilityKey,
    number
  >
}

export function eligibleChosenSkills(
  chosen: SkillKey[],
  available: SkillKey[],
  background: SkillKey[]
) {
  return [...new Set(chosen)].filter(
    (skill) => available.includes(skill) && !background.includes(skill)
  )
}
