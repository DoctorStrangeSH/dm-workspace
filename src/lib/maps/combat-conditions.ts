import { CONDITION_LIST } from '@/lib/types'
import type { TFunction } from '@/lib/i18n/dictionaries'

export interface CombatCondition {
  key: string
  label: string
}
const known = new Set<string>(CONDITION_LIST.map((condition) => condition.name))

// Display-only normalization: never writes back to a token or infers game effects.
export function combatConditions(value: unknown, t: TFunction): CombatCondition[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((condition) => {
    if (!condition || typeof condition !== 'object' || typeof condition.name !== 'string') return []
    const name = condition.name.trim()
    if (!name) return []
    const canonical = name.toLowerCase()
    const key = known.has(canonical) ? canonical : name
    if (seen.has(key)) return []
    seen.add(key)
    return [{ key, label: known.has(key) ? t('condition.' + key) : name }]
  })
}

export function matchesCombatSearch(name: string, conditions: CombatCondition[], query: string) {
  const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/ё/g, 'е')
  const haystack = normalize(
    [name, ...conditions.flatMap(({ key, label }) => [key, label])].join(' ')
  )
  return normalize(query)
    .trim()
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}
