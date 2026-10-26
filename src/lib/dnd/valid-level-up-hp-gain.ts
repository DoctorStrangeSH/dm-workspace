export function validLevelUpHPGain(currentMax: number, gain: number): boolean {
  return Number.isSafeInteger(currentMax) &&
    currentMax >= 1 &&
    Number.isSafeInteger(gain) &&
    gain >= 1 &&
    Number.isSafeInteger(currentMax + gain)
}
