import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clientToGrid, fitMap, mapFileError, mapRevision } from '../src/lib/maps/geometry'
import { nextTurnEntry, orderTurns } from '../src/lib/maps/initiative'
test('grid conversion survives zoom, scroll offsets and non-square rendered dimensions', () => {
  for (const scale of [0.1, 0.25, 0.5, 1, 2, 3]) {
    const bounds = { left: -123, top: 83, width: 1200 * scale, height: 800 * scale }
    assert.deepEqual(
      clientToGrid(
        { clientX: bounds.left + 150 * scale, clientY: bounds.top + 250 * scale },
        bounds,
        24,
        16
      ),
      { x: 3, y: 5 }
    )
    assert.deepEqual(
      clientToGrid(
        { clientX: bounds.left + 175 * scale, clientY: bounds.top + 275 * scale },
        bounds,
        24,
        16,
        'half'
      ),
      { x: 3.5, y: 5.5 }
    )
    assert.deepEqual(
      clientToGrid(
        { clientX: bounds.left + 99999, clientY: bounds.top - 50 },
        bounds,
        24,
        16,
        'cell'
      ),
      { x: 23, y: 0 }
    )
  }
})
test('fit preserves aspect and leaves padding; small maps never enlarged automatically', () => {
  assert.equal(fitMap(1200, 800, 632, 432), 0.5)
  assert.equal(fitMap(100, 100, 632, 432), 1)
  assert.equal(fitMap(1200, 800, 320, 844), 0.24)
})
test('only nonempty supported raster images up to 10MiB pass', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp'])
    assert.equal(mapFileError({ type, size: 10 * 1024 * 1024 }), null)
  assert.equal(mapFileError({ type: 'image/svg+xml', size: 100 }), 'type')
  assert.equal(mapFileError({ type: 'image/png', size: 0 }), 'empty')
  assert.equal(mapFileError({ type: 'image/png', size: 10 * 1024 * 1024 + 1 }), 'size')
})
test('opaque cache revision changes without exposing storage URL', () => {
  const first = mapRevision('https://private.test/path?token=secret')
  assert.match(first, /^[a-z0-9]+$/)
  assert.notEqual(first, mapRevision('other-map'))
})
test('turn selection handles gaps, duplicate orders, deletion and wrapping without mutating input', () => {
  const entries = [
    { id: 'b', turn_order: 7 },
    { id: 'c', turn_order: 20 },
    { id: 'a', turn_order: 7 },
  ]
  const snapshot = structuredClone(entries)
  assert.deepEqual(
    orderTurns(entries).map((x) => x.id),
    ['a', 'b', 'c']
  )
  assert.equal(nextTurnEntry(entries, 'b')?.id, 'c')
  assert.equal(nextTurnEntry(entries, 'c')?.id, 'a')
  assert.equal(nextTurnEntry(entries, 'deleted')?.id, 'a')
  assert.equal(nextTurnEntry(entries, null)?.id, 'a')
  assert.equal(nextTurnEntry([], null), undefined)
  assert.deepEqual(entries, snapshot)
})
