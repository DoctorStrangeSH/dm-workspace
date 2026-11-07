import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appendRoutePoint, MAX_ROUTE_POINTS, routeDistance } from '../src/lib/maps/route'

test('route totals include turns and retraced sections instead of start-to-end distance', () => {
  const points = [
    { x: 0.5, y: 0.5 },
    { x: 3.5, y: 0.5 },
    { x: 3.5, y: 4.5 },
  ]
  assert.deepEqual(routeDistance(points, 'straight'), { cells: 7, feet: 35 })
  assert.deepEqual(routeDistance([...points, points[1]], 'straight'), { cells: 11, feet: 55 })
  assert.deepEqual(routeDistance([], 'straight'), { cells: 0, feet: 0 })
  assert.deepEqual(routeDistance([points[0]], 'grid'), { cells: 0, feet: 0 })
})

test('diagonal policy is explicit and the total rounds once after all segments', () => {
  const points = Array.from({ length: 9 }, (_, i) => ({ x: i + 0.5, y: i + 0.5 }))
  assert.deepEqual(routeDistance(points, 'straight'), { cells: 11.3, feet: 57 })
  assert.deepEqual(routeDistance(points, 'grid'), { cells: 8, feet: 40 })
})

test('adding points ignores consecutive duplicates, retains crossings and never mutates input', () => {
  const points = Object.freeze([{ x: 1.5, y: 1.5 }])
  assert.equal(appendRoutePoint(points, points[0]).length, 1)
  const next = appendRoutePoint(points, { x: 2.5, y: 2.5 })
  assert.equal(next.length, 2)
  assert.equal(appendRoutePoint(next, points[0]).length, 3)
  assert.equal(points.length, 1)
})

test('route point limit bounds preview rendering without replacing existing points', () => {
  const points = Array.from({ length: MAX_ROUTE_POINTS }, (_, x) => ({ x, y: 0.5 }))
  assert.deepEqual(appendRoutePoint(points, { x: 100, y: 100 }), points)
  assert.equal(appendRoutePoint(points.slice(0, -1), { x: 100, y: 100 }).length, MAX_ROUTE_POINTS)
})
