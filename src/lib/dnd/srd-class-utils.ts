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

/** Reject subclass IDs and prefixed legacy IDs at server write boundaries. */
export function isCanonicalCharacterClass(value: unknown): value is string {
  return typeof value === 'string' && SRD_BASE_CLASSES.has(value)
}

/** Explicit SRD 2024 subclass-to-base-class relationships. */
export const SRD_SUBCLASS_BASE: Record<string, string> = {
  'srd-2024_path-of-the-berserker': 'barbarian',
  'srd-2024_college-of-lore': 'bard',
  'srd-2024_life-domain': 'cleric',
  'srd-2024_circle-of-the-land': 'druid',
  'srd-2024_champion': 'fighter',
  'srd-2024_warrior-of-the-open-hand': 'monk',
  'srd-2024_oath-of-devotion': 'paladin',
  'srd-2024_hunter': 'ranger',
  'srd-2024_thief': 'rogue',
  'srd-2024_draconic-sorcery': 'sorcerer',
  'srd-2024_fiend-patron': 'warlock',
  'srd-2024_evoker': 'wizard',
}

export function isSubclassForClass(subclass: unknown, baseClass: unknown): boolean {
  return typeof subclass === 'string' && typeof baseClass === 'string' &&
    SRD_SUBCLASS_BASE[subclass] === baseClass
}
