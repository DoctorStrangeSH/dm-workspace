import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spellArea, areaSize, AREA_PRESETS } from '../src/lib/maps/spell-areas'

const origin = { x: 4, y: 6 }
test('spell line has the configured length and width independently of pointer travel', () => {
  const line = spellArea('line', 100, 10, { origin, angle: 0 })
  assert.deepEqual(line.points, [
    { x: 4, y: 5 },
    { x: 24, y: 5 },
    { x: 24, y: 7 },
    { x: 4, y: 7 },
  ])
  assert.deepEqual(line.tip, { x: 24, y: 6 })
  const rotated = spellArea('line', 100, 10, { origin, angle: Math.PI / 2 })
  assert.ok(Math.abs(rotated.tip.x - 4) < 1e-10)
  assert.ok(Math.abs(rotated.tip.y - 26) < 1e-10)
  assert.equal(
    Math.hypot(
      rotated.points[0].x - rotated.points[1].x,
      rotated.points[0].y - rotated.points[1].y
    ),
    20
  )
})
test('cone width equals forward length; square is centered with independent rotation', () => {
  const cone = spellArea('cone', 15, 5, { origin, angle: 0 })
  assert.deepEqual(cone.points, [origin, { x: 7, y: 4.5 }, { x: 7, y: 7.5 }])
  const square = spellArea('cube', 15, 5, { origin, angle: Math.PI / 4 })
  assert.ok(
    Math.abs(
      Math.hypot(square.points[0].x - square.points[1].x, square.points[0].y - square.points[1].y) -
        3
    ) < 1e-10
  )
  assert.deepEqual(square.label, origin)
  assert.deepEqual(origin, { x: 4, y: 6 })
})
test('sphere radius and preset dimensions retain 5-foot scale; invalid dimensions stay bounded', () => {
  assert.equal(spellArea('sphere', 20, 5, { origin, angle: 0 }).radius, 4)
  assert.deepEqual(
    AREA_PRESETS.map((p) => [p.shape, p.size, p.width]),
    [
      ['sphere', 20, 5],
      ['cone', 15, 5],
      ['line', 100, 5],
      ['cube', 15, 5],
    ]
  )
  for (const n of [NaN, Infinity, -1, 0]) assert.equal(areaSize(n), 5)
  assert.equal(areaSize(400), 300)
  assert.equal(areaSize(7.5), 7.5)
})
