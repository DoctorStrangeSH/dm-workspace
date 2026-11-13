import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suggestedAbilities, eligibleChosenSkills } from '../src/lib/dnd/creation-workspace'
import {
  buildCharacterData,
  getPointsRemaining,
  isStandardArrayUsed,
} from '../src/lib/dnd/character-builder'
import { CLASSES, RACES, BACKGROUNDS } from '../src/lib/dnd/constants'
import { srdClassToClassInfo } from '../src/lib/dnd/srd-adapter'

test('suggestions satisfy both creation budgets for every class without mutating class priorities', () => {
  for (const cls of CLASSES) {
    const original = structuredClone(cls)
    const point = suggestedAbilities(cls.primaryAbility, 'pointbuy')
    const standard = suggestedAbilities(cls.primaryAbility, 'standard')
    assert.equal(getPointsRemaining(point), 0)
    assert.equal(isStandardArrayUsed(Object.values(standard)), true)
    const first = Array.isArray(cls.primaryAbility) ? cls.primaryAbility[0] : cls.primaryAbility
    assert.equal(point[first], 15)
    assert.deepEqual(cls, original)
    assert.deepEqual(
      srdClassToClassInfo({ key: 'srd-2024_' + cls.slug, name: cls.name, name_ru: null, data: {} })
        .primaryAbility,
      cls.primaryAbility
    )
  }
  assert.equal(isStandardArrayUsed([]), false)
  assert.equal(isStandardArrayUsed([15, 14]), false)
})
test('background changes cannot count duplicate or unavailable class proficiencies', () => {
  const chosen = ['arcana', 'insight', 'insight', 'athletics'] as const
  assert.deepEqual(
    eligibleChosenSkills([...chosen], ['arcana', 'insight', 'religion'], ['insight']),
    ['arcana']
  )
  assert.equal(chosen.length, 4)
})
test('new higher-level characters use average HP while first-level HP stays unchanged', () => {
  for (const cls of CLASSES)
    for (const level of [1, 2, 5, 20]) {
      const input = {
        name: 'Hero',
        level,
        race: RACES[0],
        class: cls,
        background: BACKGROUNDS[0],
        baseAbilities: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 15 },
        chosenSkills: [],
      }
      const data = buildCharacterData(input)
      const expected = cls.hitDie + 2 + (level - 1) * (Math.floor(cls.hitDie / 2) + 1 + 2)
      assert.deepEqual(data.hp, { current: expected, max: expected, temp: 0 })
      assert.equal(data.level, level)
    }
})
