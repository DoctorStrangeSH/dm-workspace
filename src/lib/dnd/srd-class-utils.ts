/** Base classes in the SRD 2024 class table (subclasses share that table). */
export const SRD_BASE_CLASSES = new Set([
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
])

export function baseClassSlug(key: string): string {
  return key.replace(/^srd-2024_/, '')
}

export function isSrdBaseClass(key: string): boolean {
  return SRD_BASE_CLASSES.has(baseClassSlug(key))
}

export function parseSrdHitDie(value: unknown): 6 | 8 | 10 | 12 | null {
  const n = typeof value === 'number' ? value :
    typeof value === 'string' && /^(?:d)?(?:6|8|10|12)$/i.test(value.trim())
      ? Number(value.trim().replace(/^d/i, ''))
      : NaN
  return n === 6 || n === 8 || n === 10 || n === 12 ? n : null
}
