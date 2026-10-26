import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAverageHP, rollHP, applyLevelUp, canLevelUp } from '../src/lib/dnd/level-up'
import { createEmptyCharacterData } from '../src/lib/types'

test('average HP gain respects hit dice and Constitution', () => {
  assert.equal(getAverageHP('fighter', 0), 6)
  assert.equal(getAverageHP('barbarian', 2), 9)
  assert.equal(getAverageHP('wizard', -5), 1)
  assert.equal(getAverageHP('invalid-subclass', 0), 0)
})

test('rolled HP gain is never below 1, even with negative CON modifier', () => {
  for (let i = 0; i < 100; i++) {
    const gain = rollHP('fighter', -5)
    assert.ok(gain >= 1 && gain <= 5)
  }
  assert.equal(rollHP('invalid-subclass', 0), 0)
})

test('level up increases max HP and restores current without changing temporary HP', () => {
  const before = { ...createEmptyCharacterData(), class: 'fighter',
    hp: { current: 3, max: 10, temp: 2 }, level: 1 }
  const after = applyLevelUp(before, 6)
  assert.equal(after.level, 2)
  assert.deepEqual(after.hp, { current: 16, max: 16, temp: 2 })
  assert.deepEqual(before.hp, { current: 3, max: 10, temp: 2 })
})

test('all base classes return safe positive average HP', () => {
  const classes = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
    'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
  for (const cls of classes) {
    const gain = getAverageHP(cls, 0)
    assert.ok(Number.isSafeInteger(gain) && gain >= 1 && gain <= 12, cls)
  }
})

test('level-up data preserves subclass and unrelated character fields', () => {
  const before = { ...createEmptyCharacterData(), class: 'fighter',
    subclass: 'srd-2024_champion', notes: 'Keep', features: ['Second Wind'],
    hp: { current: 3, max: 10, temp: 0 } }
  const after = applyLevelUp(before, 6)
  assert.equal(after.subclass, before.subclass)
  assert.deepEqual(after.features, before.features)
  assert.equal(after.notes, before.notes)
  assert.deepEqual(before.hp, { current: 3, max: 10, temp: 0 })
})

test('level-up eligibility requires an integer level from 1 through 19', () => {
  for (const level of [1, 2, 19]) {
    assert.equal(canLevelUp({ ...createEmptyCharacterData(), level }), true)
  }
  for (const level of [0, -1, 1.5, 20, 21, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(canLevelUp({ ...createEmptyCharacterData(), level }), false)
  }
})
