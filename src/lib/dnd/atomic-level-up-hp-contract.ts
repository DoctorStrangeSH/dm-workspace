/** Pure validation for a future transactional level-up HP RPC. No database writes. */
export interface LinkedTokenHP {
  current: number | null
  max: number | null
}

function validHP(current: number | null, max: number | null): boolean {
  return current !== null && max !== null
    && Number.isSafeInteger(current) && Number.isSafeInteger(max)
    && max > 0 && max <= 2_147_483_647 && current >= 0 && current <= max
}

/**
 * All linked token HP values must agree with the pre-level-up character.
 * Reject any drift, including old map tokens, instead of silently healing them.
 */
export function validateLinkedTokenHP(
  characterHP: LinkedTokenHP,
  tokens: readonly LinkedTokenHP[],
): boolean {
  if (!validHP(characterHP.current, characterHP.max)) return false
  return tokens.every((token) => validHP(token.current, token.max)
    && token.current === characterHP.current
    && token.max === characterHP.max)
}

/** Level-up currently fully restores HP. This must happen atomically in DB. */
export function nextLevelUpHP(
  previousHP: LinkedTokenHP,
  hpGain: number,
): LinkedTokenHP | null {
  if (!validHP(previousHP.current, previousHP.max)
    || !Number.isSafeInteger(hpGain) || hpGain < 1
    || previousHP.max! + hpGain > 2_147_483_647) return null

  const max = previousHP.max! + hpGain
  return { current: max, max }
}
