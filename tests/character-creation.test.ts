import assert from 'node:assert/strict'
import { test } from 'node:test'
import { srdClassToClassInfo, srdSpeciesToRaceInfo } from '../src/lib/dnd/srd-adapter'
import { buildCharacterData } from '../src/lib/dnd/character-builder'
import { BACKGROUNDS, CLASSES } from '../src/lib/dnd/constants'
import { characterDataHasValidHP } from '../src/lib/dnd/character-hp'

const race = srdSpeciesToRaceInfo({ key: 'srd-2024_human', name: 'Human', name_ru: null, data: {} })
function creationData(key: string, hitDie: unknown, con = 15) {
  return buildCharacterData({
    name: 'Holmes',
    level: 1,
    race,
    class: srdClassToClassInfo({ key, name: key, name_ru: null, data: { hit_die: hitDie } }),
    background: BACKGROUNDS.find((bg) => bg.slug === 'entertainer')!,
    baseAbilities: { str: 15, dex: 14, con, int: 8, wis: 10, cha: 8 },
    chosenSkills: ['arcana', 'nature'],
  })
}

test('reported sorcerer D6 + CON15 produces numeric 8 HP in the wizard payload', () => {
  const data = creationData('srd-2024_sorcerer', 'D6')
  assert.deepEqual(data.hp, { current: 8, max: 8, temp: 0 })
  assert.equal(characterDataHasValidHP(data), true)
})

test('all base classes build numeric first-level HP from numeric and SRD die strings', () => {
  for (const cls of CLASSES) {
    for (const key of [cls.slug, 'srd-2024_' + cls.slug]) {
      for (const raw of [
        cls.hitDie,
        String(cls.hitDie),
        'D' + cls.hitDie,
        ' d' + cls.hitDie + ' ',
      ]) {
        for (const con of [8, 10, 15, 20]) {
          const data = creationData(key, raw, con)
          assert.deepEqual(
            data.hp,
            {
              current: cls.hitDie + Math.floor((con - 10) / 2),
              max: cls.hitDie + Math.floor((con - 10) / 2),
              temp: 0,
            },
            key + ': ' + String(raw)
          )
          assert.equal(characterDataHasValidHP(data), true)
        }
      }
    }
  }
})

test('missing or malformed SRD dice use the supported class default, never string arithmetic', () => {
  for (const cls of CLASSES) {
    for (const raw of [undefined, null, '', 'D62', 'D20', 'D8-1', {}, 9, NaN]) {
      const data = creationData('srd-2024_' + cls.slug, raw)
      assert.deepEqual(data.hp, { current: cls.hitDie + 2, max: cls.hitDie + 2, temp: 0 })
    }
  }
})
