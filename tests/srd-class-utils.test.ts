import assert from 'node:assert/strict'
import { test } from 'node:test'
import { baseClassSlug, isSrdBaseClass, parseSrdHitDie } from '../src/lib/dnd/srd-class-utils'

test('only SRD 2024 base classes are selectable', () => {
  const accepted = ['fighter', 'druid', 'wizard', 'barbarian', 'bard', 'cleric',
    'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock']
  for (const cls of accepted) {
    assert.equal(isSrdBaseClass('srd-2024_' + cls), true, cls)
    assert.equal(baseClassSlug('srd-2024_' + cls), cls)
  }
  for (const subclass of ['srd-2024_circle-of-the-land', 'srd-2024_champion',
    'srd-2024_oath-of-devotion', 'srd-2024_college-of-lore']) {
    assert.equal(isSrdBaseClass(subclass), false, subclass)
  }
})

test('D6/D8/D10/D12 normalize without arithmetic string coercion', () => {
  for (const n of [6, 8, 10, 12]) {
    assert.equal(parseSrdHitDie('D' + n), n)
    assert.equal(parseSrdHitDie('d' + n), n)
    assert.equal(parseSrdHitDie(n), n)
  }
  for (const bad of ['D8-1', 'D20', '8hp', '', 'NaN', null, undefined, 9]) {
    assert.equal(parseSrdHitDie(bad), null)
  }
})
