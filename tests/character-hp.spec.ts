import { expect, test } from '@playwright/test'
import { CLASSES } from '../src/lib/dnd/constants'
import { getAverageHP, rollHP, applyLevelUp } from '../src/lib/dnd/level-up'
import { validCharacterHP } from '../src/lib/dnd/valid-character-hp'
import { createEmptyCharacterData } from '../src/lib/types'

// Pure calculations only. These tests don't log in, open pages, or write to Supabase.
test.describe('Character HP: runtime validation', () => {
  test('accepts valid HP including zero current and temporary points', () => {
    expect(validCharacterHP({ current: 0, max: 10, temp: 4 })).toEqual({
      current: 0, max: 10, temp: 4,
    })
  })

  for (const bad of [
    null, 'D101', {}, { current: null, max: 10 },
    { current: '10', max: 10 }, { current: 5, max: '10' },
    { current: -1, max: 10 }, { current: 11, max: 10 },
    { current: 0, max: 0 }, { current: 0, max: -1 },
    { current: Number.NaN, max: 10 }, { current: 1.5, max: 10 },
  ]) {
    test(`rejects malformed HP: ${JSON.stringify(bad)}`, () => {
      expect(validCharacterHP(bad)).toBeNull()
    })
  }
})

test.describe('Level-up HP for every supported class', () => {
  for (const cls of CLASSES) {
    test(`${cls.slug}: average and roll remain numeric and bounded`, () => {
      const conMod = 2
      const expectedAverage = Math.max(1, Math.floor(cls.hitDie / 2) + 1 + conMod)
      expect(getAverageHP(cls.slug, conMod)).toBe(expectedAverage)
      for (let i = 0; i < 30; i++) {
        const gain = rollHP(cls.slug, conMod)
        expect(Number.isInteger(gain)).toBe(true)
        expect(gain).toBeGreaterThanOrEqual(Math.max(1, 1 + conMod))
        expect(gain).toBeLessThanOrEqual(Math.max(1, cls.hitDie + conMod))
      }
      const character = { ...createEmptyCharacterData(), class: cls.slug }
      const next = applyLevelUp(character, expectedAverage)
      expect(next.level).toBe(2)
      expect(next.hp).toEqual({ current: 10 + expectedAverage, max: 10 + expectedAverage, temp: 0 })
      expect(validCharacterHP(next.hp)).not.toBeNull()
      expect(character.hp).toEqual({ current: 10, max: 10, temp: 0 })
    })
  }

  test('unknown class has no HP gain (server must reject)', () => {
    expect(getAverageHP('unknown-class', 2)).toBe(0)
    expect(rollHP('unknown-class', 2)).toBe(0)
  })
})
