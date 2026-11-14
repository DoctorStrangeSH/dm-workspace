import assert from 'node:assert/strict'
import { test } from 'node:test'
import { freeTokenPosition, monsterTokenHP } from '../src/lib/maps/token-preparation'

test('monster HP distinguishes dice from leading averages and preserves zero current', () => {
  for (const [hp, expected] of [
    ['2d8+4', 13],
    ['3d6', 10],
    ['2 D 8 - 4', 5],
    ['27 (5d8+5)', 27],
    ['12', 12],
    [12, 12],
  ] as const) {
    assert.deepEqual(monsterTokenHP({ hp }), { current: expected, max: expected })
  }
  assert.deepEqual(monsterTokenHP('{"hit_points":"2d8+4"}'), { current: 13, max: 13 })
  assert.deepEqual(monsterTokenHP({ hp: { current: 0, max: 8 } }), { current: 0, max: 8 })
})

test('unknown or corrupt HP never becomes a guessed or invalid database integer', () => {
  for (const data of [null, [], '{', 'null', {}, { hp: {} }, { hp: { current: 9, max: 8 } }])
    assert.equal(monsterTokenHP(data), null)
  for (const hp of [
    0,
    -1,
    2.5,
    NaN,
    Infinity,
    2147483648,
    '',
    '2d',
    '0d8',
    '1d1',
    '2d8-99',
    '8 HP',
    '1.5',
    '99999999999999999d8',
  ])
    assert.equal(monsterTokenHP({ hp }), null)
})

test('placement avoids entire token footprints and respects map edges', () => {
  const scene = { width: 6, height: 6 }
  const tokens = [{ x: 2, y: 2, size: 2 }]
  const before = structuredClone(tokens)
  assert.deepEqual(freeTokenPosition(scene, tokens, 2), { x: 2, y: 0 })
  assert.deepEqual(freeTokenPosition(scene, tokens, 2, 'corner'), { x: 0, y: 0 })
  assert.deepEqual(tokens, before)
  assert.deepEqual(freeTokenPosition({ width: 2, height: 2 }, [], 2), { x: 0, y: 0 })
  assert.equal(freeTokenPosition({ width: 2, height: 2 }, [{ x: 1, y: 1, size: 1 }], 2), null)
})

test('placement handles fractional footprints, full maps and invalid legacy coordinates', () => {
  assert.equal(freeTokenPosition({ width: 2, height: 2 }, [{ x: 0.5, y: 0.5, size: 1 }], 1), null)
  assert.deepEqual(freeTokenPosition({ width: 2, height: 2 }, [{ x: NaN, y: 0, size: 1 }], 1), {
    x: 0,
    y: 0,
  })
  for (const scene of [
    { width: 0, height: 1 },
    { width: 501, height: 2 },
    { width: 1.5, height: 2 },
  ])
    assert.equal(freeTokenPosition(scene, [], 1), null)
  assert.equal(freeTokenPosition({ width: 2, height: 2 }, [], 3), null)
})
