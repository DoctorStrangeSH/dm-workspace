import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateCharacterIdentityUpdate as validate } from '../src/lib/dnd/character-identity-validation'

test('rejects class change retaining incompatible subclass', () => {
  assert.match(validate(
    { class: 'druid', subclass: 'srd-2024_circle-of-the-land' },
    { class: 'fighter', subclass: 'srd-2024_circle-of-the-land' }
  ) ?? '', /Подкласс/)
})

test('accepts valid class+subclass change or subclass removal', () => {
  const old = { class: 'druid', subclass: 'srd-2024_circle-of-the-land' }
  assert.equal(validate(old, { class: 'fighter', subclass: 'srd-2024_champion' }), null)
  assert.equal(validate(old, { class: 'fighter' }), null)
})

test('preserves unchanged legacy identity during unrelated edits', () => {
  const old = { class: 'srd-2024_circle-of-the-land' }
  assert.equal(validate(old, { ...old }), null)
  assert.match(validate(old, { class: 'srd-2024_champion' }) ?? '', /основной класс/)
})

test('rejects bad subclass changes without class change', () => {
  assert.match(validate({ class: 'fighter' },
    { class: 'fighter', subclass: 'srd-2024_circle-of-the-land' }) ?? '', /Подкласс/)
})
