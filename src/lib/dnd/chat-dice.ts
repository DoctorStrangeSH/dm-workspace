export const CHAT_DICE = [4, 6, 8, 10, 12, 20, 100] as const
export type D20Mode = 'normal' | 'advantage' | 'disadvantage'

export function diceDraft(count: string, modifier: string) {
  const n = Number(count.trim())
  const bonus = Number(modifier.trim())
  const validCount = /^\d+$/.test(count.trim()) && Number.isSafeInteger(n) && n >= 1 && n <= 20
  const validModifier =
    /^[+-]?\d+$/.test(modifier.trim()) && Number.isSafeInteger(bonus) && Math.abs(bonus) <= 100
  return {
    count: n,
    modifier: bonus,
    validCount,
    validModifier,
    valid: validCount && validModifier,
  }
}

export function chatDiceExpression(
  sides: number,
  count: number,
  modifier: number,
  mode: D20Mode = 'normal'
) {
  if (
    !CHAT_DICE.some((die) => die === sides) ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > 20 ||
    !Number.isSafeInteger(modifier) ||
    Math.abs(modifier) > 100
  )
    return null
  if (
    !['normal', 'advantage', 'disadvantage'].includes(mode) ||
    (mode !== 'normal' && (sides !== 20 || count !== 1))
  )
    return null
  return `${count}d${sides}${mode === 'advantage' ? 'adv' : mode === 'disadvantage' ? 'dis' : ''}${modifier ? (modifier > 0 ? '+' : '') + modifier : ''}`
}

/** Client-generated chat roll, not an authoritative or verifiable server roll. */
export function rollChatDice(
  sides: number,
  count: number,
  modifier: number,
  mode: D20Mode = 'normal',
  random: () => number = Math.random
) {
  const expression = chatDiceExpression(sides, count, modifier, mode)
  if (!expression) return null
  const rolls: number[] = []
  for (let i = 0; i < (mode === 'normal' ? count : 2); i++) {
    const sample = random()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) return null
    rolls.push(Math.floor(sample * sides) + 1)
  }
  const sum =
    mode === 'advantage'
      ? Math.max(...rolls)
      : mode === 'disadvantage'
        ? Math.min(...rolls)
        : rolls.reduce((a, b) => a + b, 0)
  return {
    expression,
    rolls,
    total: sum + modifier,
    modifier,
    advantage: mode === 'advantage',
    disadvantage: mode === 'disadvantage',
  }
}
