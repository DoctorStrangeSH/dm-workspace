import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nextLevelUpHP, validateLinkedTokenHP } from '../src/lib/dnd/atomic-level-up-hp-contract'

test('matching tokens pass, including multiple tokens', () => {
  assert.equal(validateLinkedTokenHP({ current: 3, max: 10 }, [{ current: 3, max: 10 }, { current: 3, max: 10 }]), true)
  assert.equal(validateLinkedTokenHP({ current: 3, max: 10 }, []), true)
})

test('stale token, mismatched maximum or missing HP fail closed', () => {
  assert.equal(validateLinkedTokenHP({ current: 47, max: 47 }, [{ current: 3, max: 10 }]), false)
  assert.equal(validateLinkedTokenHP({ current: 3, max: 10 }, [{ current: 3, max: 11 }]), false)
  assert.equal(validateLinkedTokenHP({ current: 3, max: 10 }, [{ current: null, max: null }]), false)
  assert.equal(validateLinkedTokenHP({ current: null, max: 10 }, []), false)
})

test('invalid HP or overflow is rejected', () => {
  assert.equal(validateLinkedTokenHP({ current: -1, max: 10 }, []), false)
  assert.equal(validateLinkedTokenHP({ current: 11, max: 10 }, []), false)
  assert.equal(validateLinkedTokenHP({ current: 1.5, max: 10 }, []), false)
  assert.equal(nextLevelUpHP({ current: 3, max: 10 }, 0), null)
  assert.equal(nextLevelUpHP({ current: 3, max: 2_147_483_647 }, 1), null)
})

test('level-up yields full HP at the new max; does not mutate inputs', () => {
  const before = { current: 3, max: 10 }
  assert.deepEqual(nextLevelUpHP(before, 6), { current: 16, max: 16 })
  assert.deepEqual(before, { current: 3, max: 10 })
})
