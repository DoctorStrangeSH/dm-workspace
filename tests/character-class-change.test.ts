import assert from 'node:assert/strict'
import { test } from 'node:test'
import { changeCharacterClass } from '../src/lib/dnd/character-class-change'
import { createEmptyCharacterData } from '../src/lib/types'

test('changing base class preserves all unrelated fields and source data', () => {
  const original = { ...createEmptyCharacterData(), class: 'fighter', subclass: 'srd-2024_champion',
    hp: { current: 3, max: 10, temp: 0 }, level: 7,
    proficientSkills: ['athletics' as const], features: ['Second Wind'],
    notes: 'Keep this note' }
  const snapshot = JSON.stringify(original)
  const next = changeCharacterClass(original, 'druid', 'srd-2024_circle-of-the-land')
  assert.equal(next.class, 'druid')
  assert.equal(next.subclass, 'srd-2024_circle-of-the-land')
  for (const k of ['hp', 'level', 'abilities', 'proficientSkills', 'features', 'notes'] as const) {
    assert.deepEqual(next[k], original[k])
  }
  assert.equal(JSON.stringify(original), snapshot)
})

test('removing a subclass leaves other character values untouched', () => {
  const original = { ...createEmptyCharacterData(), class: 'fighter', subclass: 'srd-2024_champion' }
  const next = changeCharacterClass(original, 'fighter')
  assert.equal(Object.hasOwn(next, 'subclass'), false)
  assert.equal(original.subclass, 'srd-2024_champion')
})

test('invalid class or unrelated subclass cannot be saved', () => {
  const original = createEmptyCharacterData()
  assert.throws(() => changeCharacterClass(original, 'srd-2024_champion'))
  assert.throws(() => changeCharacterClass(original, 'fighter', 'srd-2024_circle-of-the-land'))
})
