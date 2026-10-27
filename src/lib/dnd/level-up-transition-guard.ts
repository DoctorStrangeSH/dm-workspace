import type { CharacterData } from '../types'

/**
 * Validate a proposed level-up transition against a server-calculated result.
 * Do not accept client-chosen new character fields or HP gain as authoritative.
 * This guard complements, but does not replace, database-side authorization/CAS.
 */
export function isExpectedLevelUpTransition(
  actual: CharacterData,
  proposed: CharacterData,
  calculated: CharacterData,
): boolean {
  if (!Number.isSafeInteger(actual.level) || actual.level < 1 || actual.level >= 20) return false
  if (calculated.level !== actual.level + 1 || proposed.level !== calculated.level) return false
  if (!Number.isSafeInteger(calculated.hp.max) || calculated.hp.max <= actual.hp.max) return false
  if (calculated.hp.current !== calculated.hp.max) return false
  // Object identity is insufficient; compare the complete serialized transition.
  // Application must calculate the expected object from a freshly fetched CAS snapshot.
  return JSON.stringify(proposed) === JSON.stringify(calculated)
}
