import type { CharacterHP } from '@/lib/types'

// tokens.hp_current/hp_max are PostgreSQL integers.
export const MAX_CHARACTER_HP = 2_147_483_647
export const INVALID_HP =
  'Некорректные HP: нужны целые значения, max ≥ 1, 0 ≤ current ≤ max и temp ≥ 0.'

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function hpInteger(value: unknown, minimum: number): value is number {
  return (
    Number.isInteger(value) && (value as number) >= minimum && (value as number) <= MAX_CHARACTER_HP
  )
}

/** Missing temp is supported for legacy JSON; required current/max are never guessed. */
export function readCharacterHP(value: unknown): CharacterHP | null {
  if (!record(value) || !hpInteger(value.current, 0) || !hpInteger(value.max, 1)) return null
  if (value.current > value.max) return null
  if (value.temp !== undefined && !hpInteger(value.temp, 0)) return null
  return { current: value.current, max: value.max, temp: value.temp ?? 0 }
}

export function characterDataHasValidHP(value: unknown): boolean {
  return record(value) && readCharacterHP(value.hp) !== null
}

/** An explicit invalid current is rejected; lowering max alone clamps the existing current. */
export function characterHPPatch(current: unknown, patch: unknown): CharacterHP | null {
  const hp = readCharacterHP(current)
  if (!hp || !record(patch)) return null
  const keys = Object.keys(patch)
  if (!keys.length || keys.some((key) => !['current', 'max', 'temp'].includes(key))) return null
  for (const key of keys) if (!hpInteger(patch[key], key === 'max' ? 1 : 0)) return null
  const next = { ...hp, ...patch }
  if (!Object.hasOwn(patch, 'current')) next.current = Math.min(next.current, next.max)
  return readCharacterHP(next)
}
