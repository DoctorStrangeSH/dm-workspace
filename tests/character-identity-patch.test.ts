import assert from 'node:assert/strict'
import { test } from 'node:test'
import { characterIdentityPatch } from '../src/lib/dnd/character-identity-patch'

test('class change only returns class/subclass keys', () => {
  assert.deepEqual(characterIdentityPatch('wizard', 'srd-2024_fighter', 'srd-2024_champion'), {
    class: 'fighter', subclass: 'srd-2024_champion',
  })
  assert.deepEqual(characterIdentityPatch('fighter', 'wizard'), { class: 'wizard' })
})

test('reject invalid classes and mismatched subclass without changing data', () => {
  assert.equal(characterIdentityPatch('fighter', 'srd-2024_champion'), null)
  assert.equal(characterIdentityPatch('fighter', 'wizard', 'srd-2024_champion'), null)
  assert.equal(characterIdentityPatch('fighter', ''), null)
})
