import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEmptyCharacterData } from '../src/lib/types'
import { applyLevelUp } from '../src/lib/dnd/level-up'
import { isExpectedLevelUpTransition } from '../src/lib/dnd/level-up-transition-guard'

test('allows only a server-calculated level-up snapshot', () => {
  const before = { ...createEmptyCharacterData(), class: 'fighter', level: 1, hp: { current: 3, max: 10, temp: 0 } }
  const next = applyLevelUp(before, 6)
  assert.equal(isExpectedLevelUpTransition(before, next, next), true)
  assert.equal(isExpectedLevelUpTransition(before, { ...next, hp: { ...next.hp, current: 1 } }, next), false)
  assert.equal(isExpectedLevelUpTransition(before, { ...next, level: 20 }, next), false)
  assert.equal(isExpectedLevelUpTransition(before, { ...next, notes: 'unexpected' }, next), false)
})

test('rejects invalid progression and unchanged maximum HP', () => {
  const before = { ...createEmptyCharacterData(), class: 'fighter', level: 20, hp: { current: 10, max: 10, temp: 0 } }
  const next = { ...before, level: 21 }
  assert.equal(isExpectedLevelUpTransition(before, next, next), false)
  const first = { ...before, level: 1 }
  assert.equal(isExpectedLevelUpTransition(first, first, first), false)
})
