import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  TokenMovement,
  compareTokenRevision,
  type TokenPosition,
} from '../src/lib/maps/token-movement'

const point = (x: number, revision: number): TokenPosition => ({
  x,
  y: 0,
  updated_at: `2030-01-01T00:00:00.${String(revision).padStart(6, '0')}Z`,
})
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
function rig() {
  const painted: number[] = [],
    errors: (string | null)[] = []
  const calls: {
    x: number
    resolve: (result: { position: TokenPosition } | { error: string }) => void
    reject: (error: Error) => void
  }[] = []
  const movement = new TokenMovement(
    point(0, 0),
    (p) => new Promise((resolve, reject) => calls.push({ x: p.x, resolve, reject })),
    (p) => painted.push(p.x),
    (e) => errors.push(e)
  )
  return { movement, painted, errors, calls }
}
test('microsecond timestamps and equivalent timezone representations retain ordering', () => {
  assert.equal(compareTokenRevision(point(0, 2).updated_at, point(0, 1).updated_at), 1)
  assert.equal(compareTokenRevision('2030-01-01T03:00:00.000001+03:00', point(0, 1).updated_at), 0)
})
test('rapid moves serialize and coalesce, stale broadcasts and acknowledgements cannot rewind latest intent', async () => {
  const r = rig()
  r.movement.move({ x: 1, y: 0 })
  r.movement.move({ x: 2, y: 0 })
  r.movement.move({ x: 3, y: 0 })
  assert.deepEqual(
    r.calls.map((c) => c.x),
    [1]
  )
  r.movement.receive(point(0, 0))
  r.calls[0].resolve({ position: point(1, 1) })
  await tick()
  assert.deepEqual(
    r.calls.map((c) => c.x),
    [1, 3]
  )
  assert.equal(r.movement.position.x, 3)
  r.movement.receive(point(1, 1))
  r.calls[1].resolve({ position: point(3, 3) })
  await tick()
  r.movement.receive(point(1, 1))
  r.movement.receive(point(2, 2))
  assert.equal(r.movement.position.x, 3)
  assert.deepEqual(r.painted, [1, 2, 3, 3])
  r.movement.receive(point(4, 4))
  assert.equal(r.movement.position.x, 4)
})
test('earlier failure preserves queued intent; final failure uses last authoritative location', async () => {
  const r = rig()
  r.movement.move({ x: 1, y: 0 })
  r.movement.move({ x: 2, y: 0 })
  r.calls[0].resolve({ error: 'denied' })
  await tick()
  assert.equal(r.movement.position.x, 2)
  r.movement.receive(point(5, 5))
  r.calls[1].resolve({ error: 'denied' })
  await tick()
  assert.equal(r.movement.position.x, 5)
})
test('lost response keeps location until acknowledgement; disposal suppresses callbacks while completing requested moves', async () => {
  const r = rig()
  r.movement.move({ x: 1, y: 0 })
  r.calls[0].reject(new Error('disconnected'))
  await tick()
  r.movement.receive(point(0, 0))
  assert.equal(r.movement.position.x, 1)
  assert.deepEqual(r.errors, [null])
  // A newer authoritative move from another client must also end uncertainty.
  r.movement.receive(point(5, 1))
  assert.equal(r.movement.position.x, 5)
  r.movement.move({ x: 2, y: 0 })
  r.movement.move({ x: 3, y: 0 })
  const before = [...r.painted]
  r.movement.dispose()
  r.calls[1].resolve({ position: point(2, 2) })
  await tick()
  assert.equal(r.calls.length, 3)
  r.calls[2].resolve({ position: point(3, 3) })
  await tick()
  assert.deepEqual(r.painted, before)
})
