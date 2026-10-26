import type { CharacterHP } from '@/lib/types'

/** Treat persisted JSON as untrusted: never render strings/null/NaN as hit points. */
export function validCharacterHP(value: unknown): CharacterHP | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const hp = value as Record<string, unknown>
  if (
    typeof hp.current !== 'number' ||
    typeof hp.max !== 'number' ||
    !Number.isSafeInteger(hp.current) ||
    !Number.isSafeInteger(hp.max) ||
    hp.current < 0 ||
    hp.max <= 0 ||
    hp.current > hp.max
  ) {
    return null
  }

  const temp =
    typeof hp.temp === 'number' && Number.isSafeInteger(hp.temp) && hp.temp >= 0
      ? hp.temp
      : 0

  return { current: hp.current, max: hp.max, temp }
}
