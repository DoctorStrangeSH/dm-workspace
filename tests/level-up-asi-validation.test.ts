import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateLevelUpASI as validate } from '../src/lib/dnd/level-up-asi-validation'

test('non-ASI levels forbid changes', () => {
  assert.equal(validate(2, undefined), null)
  assert.match(validate(2, { str: 2 }) ?? '', /недоступно/)
})
test('ASI levels require exactly two points in a valid layout', () => {
  for (const level of [4, 8, 12, 16, 19]) {
    assert.equal(validate(level, { str: 2 }, { str: 15, con: 15 }), null)
    assert.equal(validate(level, { str: 1, con: 1 }, { str: 15, con: 15 }), null)
    assert.notEqual(validate(level, undefined), null)
    assert.notEqual(validate(level, { str: 1 }), null)
    assert.notEqual(validate(level, { str: 2, dex: 2 }), null)
    assert.notEqual(validate(level, { rogue: 2 }), null)
    assert.notEqual(validate(level, { str: -2 }), null)
  }
})
test('reject malformed runtime inputs', () => {
  assert.notEqual(validate(4, null), null)
  assert.notEqual(validate(4, ['str']), null)
  assert.notEqual(validate(4, { str: '2' }), null)
})

test('rejects increases beyond 20 without consuming ASI points', () => {
  assert.match(validate(4, { str: 2 }, { str: 19 }) ?? '', /превышать 20/)
  assert.match(validate(4, { str: 1, con: 1 }, { str: 20, con: 16 }) ?? '', /превышать 20/)
  assert.equal(validate(4, { str: 2 }, { str: 18 }), null)
  assert.equal(validate(4, { str: 1, con: 1 }, { str: 19, con: 19 }), null)
  assert.match(validate(4, { str: 2 }, { str: Number.NaN }) ?? '', /исходные/)
})
