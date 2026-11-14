import { MAX_CHARACTER_HP, readCharacterHP } from '../dnd/character-hp'
import type { Scene, Token } from '@/lib/types'

export type PreparedHP = { current: number; max: number }
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** Read stat-block HP without mistaking the first die count for hit points. */
export function monsterTokenHP(data: unknown): PreparedHP | null {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (!record(data)) return null
  const raw = data.hp ?? data.hit_points ?? data.hp_max
  if (record(raw)) {
    const hp = readCharacterHP(raw)
    return hp ? { current: hp.current, max: hp.max } : null
  }
  let value: number
  if (typeof raw === 'number') value = raw
  else if (typeof raw === 'string') {
    const text = raw.trim()
    const dice = text.match(/^(\d+)\s*d\s*(\d+)(?:\s*([+-])\s*(\d+))?$/i)
    const average = text.match(/^(\d+)(?:\s*\(\s*\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?\s*\))?$/i)
    if (dice) {
      const count = Number(dice[1]),
        sides = Number(dice[2])
      if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(sides) || sides < 2)
        return null
      value = Math.floor(
        (count * (sides + 1)) / 2 + Number(dice[4] ?? 0) * (dice[3] === '-' ? -1 : 1)
      )
    } else if (average) value = Number(average[1])
    else return null
  } else return null
  return Number.isInteger(value) && value > 0 && value <= MAX_CHARACTER_HP
    ? { current: value, max: value }
    : null
}

/** Best-effort placement from the current snapshot, not a multiplayer reservation. */
export function freeTokenPosition(
  scene: Pick<Scene, 'width' | 'height'>,
  tokens: Pick<Token, 'x' | 'y' | 'size'>[],
  size: number,
  anchor: 'center' | 'corner' = 'center'
): { x: number; y: number } | null {
  const { width, height } = scene
  if (
    ![width, height, size].every(Number.isSafeInteger) ||
    width < 1 ||
    height < 1 ||
    width > 500 ||
    height > 500 ||
    size < 1 ||
    size > 4 ||
    size > width ||
    size > height
  )
    return null
  const occupied = new Set<number>()
  for (const token of tokens) {
    if (
      ![token.x, token.y, token.size].every(Number.isFinite) ||
      token.size <= 0 ||
      token.size > 10
    )
      continue
    for (
      let y = Math.max(0, Math.floor(token.y));
      y < Math.min(height, Math.ceil(token.y + token.size));
      y++
    )
      for (
        let x = Math.max(0, Math.floor(token.x));
        x < Math.min(width, Math.ceil(token.x + token.size));
        x++
      )
        occupied.add(y * width + x)
  }
  const target =
    anchor === 'center'
      ? { x: Math.floor((width - size) / 2), y: Math.floor((height - size) / 2) }
      : { x: 0, y: 0 }
  let best: { x: number; y: number } | null = null
  let distance = Infinity
  for (let y = 0; y <= height - size; y++)
    for (let x = 0; x <= width - size; x++) {
      const nextDistance = (x - target.x) ** 2 + (y - target.y) ** 2
      if (nextDistance >= distance) continue
      let blocked = false
      for (let row = y; row < y + size && !blocked; row++)
        for (let col = x; col < x + size; col++)
          if (occupied.has(row * width + col)) {
            blocked = true
            break
          }
      if (!blocked) {
        best = { x, y }
        distance = nextDistance
      }
    }
  return best
}
