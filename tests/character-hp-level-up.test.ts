import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEmptyCharacterData, type CharacterData } from '../src/lib/types'
import { CLASSES } from '../src/lib/dnd/constants'
import { MAX_CHARACTER_HP, readCharacterHP, characterHPPatch } from '../src/lib/dnd/character-hp'
import {
  applyLevelUp,
  canLevelUp,
  getAverageHP,
  getHPGainRange,
  prepareLevelUp,
  rollHP,
} from '../src/lib/dnd/level-up'

const character = (changes: Partial<CharacterData> = {}): CharacterData => ({
  ...createEmptyCharacterData(),
  class: 'fighter',
  ...changes,
})

test('HP rejects malformed saved values without coercion or guessing required keys', () => {
  for (const hp of [
    null,
    [],
    {},
    { current: 1 },
    { max: 10 },
    { current: '1', max: 10 },
    { current: 1, max: '10' },
    { current: NaN, max: 10 },
    { current: Infinity, max: 10 },
    { current: 1.5, max: 10 },
    { current: -1, max: 10 },
    { current: 11, max: 10 },
    { current: 0, max: 0 },
    { current: 1, max: MAX_CHARACTER_HP + 1 },
    { current: 1, max: 10, temp: null },
    { current: 1, max: 10, temp: -1 },
    { current: 1, max: 10, temp: '0' },
  ])
    assert.equal(readCharacterHP(hp), null, JSON.stringify(hp))
  assert.deepEqual(readCharacterHP({ current: 0, max: MAX_CHARACTER_HP }), {
    current: 0,
    max: MAX_CHARACTER_HP,
    temp: 0,
  })
})

test('manual HP patch rejects invalid requests; max-only reductions preserve clamping', () => {
  const hp = Object.freeze({ current: 8, max: 10, temp: 2 })
  for (const patch of [
    null,
    [],
    {},
    { current: -1 },
    { current: 11 },
    { current: '5' },
    { current: undefined },
    { max: NaN },
    { temp: 1.5 },
    { extra: 1 },
  ])
    assert.equal(characterHPPatch(hp, patch), null)
  assert.deepEqual(characterHPPatch(hp, { max: 5 }), { current: 5, max: 5, temp: 2 })
  assert.deepEqual(characterHPPatch(hp, { current: 0 }), { current: 0, max: 10, temp: 2 })
  assert.deepEqual(hp, { current: 8, max: 10, temp: 2 })
})

test('invalid levels, class/subclass, HP and ability shapes cannot level up or consume a roll', () => {
  const bad = [
    null,
    {},
    ...[0, -1, 1.5, '1', NaN, Infinity, 20, 21].map((level) => ({ ...character(), level })),
    character({ class: '' }),
    character({ class: 'srd-2024_fighter' }),
    character({ subclass: 'srd-2024_evoker' }),
    { ...character(), hp: null },
    { ...character(), hp: { current: '10', max: '10' } },
    { ...character(), abilities: null },
    { ...character(), abilities: { ...character().abilities, con: NaN } },
    { ...character(), abilities: { ...character().abilities, con: 1.5 } },
    { ...character(), abilities: { ...character().abilities, dex: 31 } },
  ]
  for (const data of bad) {
    assert.equal(canLevelUp(data), false)
    assert.ok(
      'error' in
        prepareLevelUp(data as CharacterData, { hpMethod: 'roll' }, () => {
          throw Error('must not roll')
        })
    )
  }
})

for (const cls of CLASSES)
  test(`${cls.slug}: average, all die outcomes and unchanged data`, () => {
    const data = character({
      class: cls.slug,
      notes: 'keep',
      inventory: [{ id: 'a', name: 'item', quantity: 1 }],
    })
    const before = structuredClone(data)
    const average = prepareLevelUp(data, { hpMethod: 'average' }, () => {
      throw Error('average must not roll')
    })
    assert.ok(!('error' in average))
    assert.equal(average.hpGain, cls.hitDie / 2 + 1)
    assert.equal(average.data.hp.max, 10 + average.hpGain)
    assert.deepEqual(getHPGainRange(cls.slug, 0), { min: 1, max: cls.hitDie })
    for (let face = 1; face <= cls.hitDie; face++) {
      let calls = 0
      const result = prepareLevelUp(data, { hpMethod: 'roll' }, () => {
        calls++
        return (face - 0.5) / cls.hitDie
      })
      assert.ok(!('error' in result))
      assert.equal(result.hpGain, face)
      assert.equal(calls, 1)
      assert.deepEqual(result.data.inventory, data.inventory)
      assert.equal(result.data.notes, 'keep')
    }
    assert.deepEqual(data, before)
  })

test('supported boundary levels keep level 20 reachable without exceeding it', () => {
  const result = prepareLevelUp(character({ level: 19 }), { hpMethod: 'average' })
  assert.ok(!('error' in result))
  assert.equal(result.data.level, 20)
  assert.equal(canLevelUp(result.data), false)
})

test('CON endpoints are supported and malformed modifiers cannot produce NaN', () => {
  assert.equal(getAverageHP('wizard', -5), 1)
  assert.equal(
    rollHP('wizard', -5, () => 0),
    1
  )
  assert.equal(getAverageHP('barbarian', 10), 17)
  for (const con of [NaN, Infinity, -Infinity, 0.5, -6, 11]) {
    assert.equal(getAverageHP('fighter', con), 0)
    assert.equal(
      rollHP('fighter', con, () => {
        throw Error('must not roll')
      }),
      0
    )
  }
})

test('request and ASI validation happens before randomness', () => {
  const data = character({ level: 3 })
  const options = [
    null,
    [],
    {},
    { hpMethod: 'other' },
    { hpMethod: 'roll', extra: true },
    ...[
      null,
      [],
      {},
      { str: -1, dex: 3 },
      { str: '2' },
      { str: 1.5, dex: 0.5 },
      { unknown: 2 },
      { str: 1 },
      { str: 2, dex: 2 },
      JSON.parse('{"__proto__":2}'),
    ].map((abilityChanges) => ({ hpMethod: 'roll', abilityChanges })),
  ]
  for (const value of options)
    assert.ok(
      'error' in
        prepareLevelUp(data, value, () => {
          throw Error('must not roll')
        })
    )
  assert.ok(
    'error' in
      prepareLevelUp(character(), { hpMethod: 'roll', abilityChanges: { str: 2 } }, () => {
        throw Error('must not roll')
      })
  )
})

test('ASI allows +2 or +1/+1, requires a legal budget and never silently truncates at 20', () => {
  const data = character({ level: 3, subclass: 'srd-2024_champion' })
  for (const changes of [{ str: 2 }, { str: 1, dex: 1 }]) {
    const result = prepareLevelUp(data, { hpMethod: 'average', abilityChanges: changes })
    assert.ok(!('error' in result))
    assert.equal(result.data.subclass, data.subclass)
    assert.equal(result.data.abilities.str, data.abilities.str + changes.str)
  }
  const at19 = character({ level: 3, abilities: { ...data.abilities, str: 19, dex: 19 } })
  assert.ok('error' in prepareLevelUp(at19, { hpMethod: 'average', abilityChanges: { str: 2 } }))
  const split = prepareLevelUp(at19, { hpMethod: 'average', abilityChanges: { str: 1, dex: 1 } })
  assert.ok(!('error' in split))
  assert.equal(split.data.abilities.str, 20)
  assert.equal(split.data.abilities.dex, 20)
})

test('HP overflow is rejected before rolling; exact upper bound is accepted', () => {
  const data = character({
    hp: { current: MAX_CHARACTER_HP - 5, max: MAX_CHARACTER_HP - 5, temp: 0 },
  })
  for (const hpMethod of ['average', 'roll'])
    assert.ok(
      'error' in
        prepareLevelUp(data, { hpMethod }, () => {
          throw Error('must not roll')
        })
    )
  const exact = prepareLevelUp(
    character({ hp: { current: 0, max: MAX_CHARACTER_HP - 6, temp: 0 } }),
    { hpMethod: 'average' }
  )
  assert.ok(!('error' in exact))
  assert.equal(exact.data.hp.max, MAX_CHARACTER_HP)
  for (const gain of [0, -1, NaN, 1.5, 11])
    assert.throws(() => applyLevelUp(character(), gain), RangeError)
})
