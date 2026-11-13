import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  characterFeaturePatch,
  rollCharacterDamage,
  spellRuleText,
  isConcentration,
} from '../src/lib/dnd/character-workspace'
import { createEmptyCharacterData } from '../src/lib/types'
import { spellSchoolLabel } from '../src/lib/i18n/labels'

test('feature edits retain the exact version and all unrelated combat/spell/equipment data', () => {
  const original = {
    ...createEmptyCharacterData(),
    hp: { current: 4, max: 8, temp: 2 },
    spells: [{ id: 's', name: 'Spell', level: 1 }],
    inventory: [{ id: 'i', name: 'Sword', quantity: 1 }],
  }
  const before = structuredClone(original)
  const draft = {
    features: ['Ability\nDescription'],
    traits: ['Trait'],
    notes: 'Notes',
    attacks: [{ name: 'Sword', bonus: 5, damage: '1d8+3' }],
  }
  const patch = characterFeaturePatch(original, draft)!
  assert.equal(patch.expected_data_json, original)
  assert.deepEqual(patch.data_json.hp, original.hp)
  assert.deepEqual(patch.data_json.inventory, original.inventory)
  assert.deepEqual(patch.data_json.spells, original.spells)
  assert.deepEqual(patch.data_json.attacks, draft.attacks)
  assert.deepEqual(original, before)
  assert.equal(characterFeaturePatch(original, { ...draft, features: [' '] }), null)
  assert.equal(characterFeaturePatch(original, { ...draft, notes: 'x'.repeat(12001) }), null)
  assert.equal(
    characterFeaturePatch(original, {
      ...draft,
      attacks: [{ name: 'Sword', bonus: NaN, damage: '1d8' }],
    }),
    null
  )
})
test('bounded damage rolls preserve dice, reject unsupported formulas and cannot be negative', () => {
  assert.deepEqual(rollCharacterDamage('2d6+3', () => 0)?.rolls, [1, 1])
  assert.equal(rollCharacterDamage('2d6+3', () => 0)?.total, 5)
  assert.equal(rollCharacterDamage('1d4-100', () => 0)?.total, 0)
  assert.equal(rollCharacterDamage('0')?.total, 0)
  for (const value of ['21d6', '0d6', '1d999', '1d6+101', '1d8+1d4', '999999d6', '-1', '101'])
    assert.equal(rollCharacterDamage(value), null, value)
  assert.equal(
    rollCharacterDamage('1d6', () => 1),
    null
  )
})
test('school casing and known rule labels localize without altering custom source text', () => {
  assert.equal(spellSchoolLabel('ru', 'Evocation'), 'Воплощение')
  assert.equal(spellSchoolLabel('en', 'Unknown School'), 'Unknown School')
  assert.equal(spellRuleText('90 feet', 'ru'), '90 фт')
  assert.equal(spellRuleText('instantaneous', 'ru'), 'Мгновенно')
  assert.equal(spellRuleText('Concentration, up to 1 minute', 'ru'), 'Концентрация, до 1 мин')
  assert.equal(spellRuleText('A custom rule', 'ru'), 'A custom rule')
  assert.equal(spellRuleText('90 feet', 'en'), '90 feet')
  assert.equal(isConcentration('Концентрация, до 1 минуты'), true)
})
