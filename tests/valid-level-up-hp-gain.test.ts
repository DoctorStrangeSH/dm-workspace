import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validLevelUpHPGain } from '../src/lib/dnd/valid-level-up-hp-gain'

test('allows normal HP increase and safe numeric boundary', () => {
  assert.equal(validLevelUpHPGain(10, 6), true)
  assert.equal(validLevelUpHPGain(Number.MAX_SAFE_INTEGER - 1, 1), true)
})
test('rejects corrupted gains and HP overflow', () => {
  for (const gain of [0, -1, 1.5, NaN, Infinity]) {
    assert.equal(validLevelUpHPGain(10, gain), false)
  }
  assert.equal(validLevelUpHPGain(Number.MAX_SAFE_INTEGER, 1), false)
  assert.equal(validLevelUpHPGain(Number.MAX_SAFE_INTEGER - 1, 2), false)
  assert.equal(validLevelUpHPGain(NaN, 1), false)
  assert.equal(validLevelUpHPGain(0, 1), false)
})
