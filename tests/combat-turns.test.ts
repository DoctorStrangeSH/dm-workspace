import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import * as turnHelpers from '../src/lib/maps/initiative'
import * as formulas from '../src/lib/dnd/formulas'
const source = ts.transpileModule(
  readFileSync(new URL('../src/lib/actions/combat.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText
type Row = {
  id: string
  scene_id: string
  token_id: string
  initiative: number
  turn_order: number
  is_current: boolean
}
function rig(initial: Row[], isDm = true, failCurrent = false) {
  const rows = structuredClone(initial)
  const writes: { table: string; value: Record<string, unknown>; filters: [string, unknown][] }[] =
    []
  const queries: { table: string; orders: string[] }[] = []
  const db = {
    from(table: string) {
      const filters: [string, unknown][] = []
      const orders: { key: string; ascending: boolean }[] = []
      let update: Record<string, unknown> | undefined
      const execute = () => {
        if (table === 'scenes') return { data: { campaign_id: 'campaign' }, error: null }
        if (table === 'tokens')
          return {
            data: { id: 't', name: 'Hero', character_id: null, entity_id: null },
            error: null,
          }
        if (table !== 'initiative') throw Error('unexpected table ' + table)
        const found = rows.filter((row) =>
          filters.every(([key, value]) => row[key as keyof Row] === value)
        )
        if (failCurrent && filters.some(([k]) => k === 'is_current'))
          return { data: null, error: { message: 'read failed' } }
        if (update) {
          writes.push({ table, value: update, filters: [...filters] })
          found.forEach((row) => Object.assign(row, update))
        }
        for (const order of [...orders].reverse())
          found.sort((a, b) => {
            const aa = a[order.key as keyof Row],
              bb = b[order.key as keyof Row]
            return (aa < bb ? -1 : aa > bb ? 1 : 0) * (order.ascending ? 1 : -1)
          })
        return { data: found, error: null }
      }
      const q = {
        select: () => q,
        limit: () => q,
        eq: (key: string, value: unknown) => {
          filters.push([key, value])
          return q
        },
        order: (key: string, options?: { ascending: boolean }) => {
          orders.push({ key, ascending: options?.ascending ?? true })
          queries.push({ table, orders: orders.map((x) => x.key) })
          return q
        },
        update: (value: Record<string, unknown>) => {
          update = value
          return q
        },
        single: async () => {
          const r = execute()
          return { ...r, data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data }
        },
        maybeSingle: async () => {
          const r = execute()
          return { ...r, data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data }
        },
        then: (resolve: (value: unknown) => void) => Promise.resolve(execute()).then(resolve),
      }
      return q
    },
  }
  const imports: Record<string, unknown> = {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/queries/access': { getCampaignAccess: async () => ({ isDm }) },
    'next/cache': { revalidatePath: () => {} },
    './logs': { logEvent: async () => {} },
    '@/lib/maps/initiative': turnHelpers,
    '@/lib/dnd/formulas': formulas,
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, 'unexpected dependency ' + name)
    return imports[name]
  }, exports)
  return { actions: exports as typeof import('../src/lib/actions/combat'), rows, writes, queries }
}
const rows: Row[] = [
  { id: 'a', scene_id: 'scene', token_id: 't', initiative: 18, turn_order: 0, is_current: false },
  { id: 'b', scene_id: 'scene', token_id: 'u', initiative: 0, turn_order: 7, is_current: true },
  { id: 'c', scene_id: 'scene', token_id: 'v', initiative: 10, turn_order: 20, is_current: false },
]
test('actual nextTurn action cycles through gaps and wraps', async () => {
  const r = rig(rows)
  assert.ok('success' in (await r.actions.nextTurn('scene')))
  assert.equal(r.rows.find((x) => x.is_current)?.id, 'c')
  assert.ok('success' in (await r.actions.nextTurn('scene')))
  assert.equal(r.rows.find((x) => x.is_current)?.id, 'a')
})
test('actual roll action reorders without taking current turn away or starting preparation', async () => {
  for (const active of [true, false]) {
    const r = rig(rows.map((x) => ({ ...x, is_current: active && x.id === 'b' })))
    assert.ok('success' in (await r.actions.rollInitiativeForToken('a', 'scene')))
    assert.equal(r.rows.find((x) => x.is_current)?.id, active ? 'b' : undefined)
    assert.ok(r.writes.every((x) => !('is_current' in x.value)))
    assert.ok(r.queries.some((x) => x.orders.join(',') === 'initiative,id'))
  }
})
test('no current read failure or player authorization can produce turn writes', async () => {
  for (const r of [rig(rows, false), rig(rows, true, true)]) {
    assert.ok('error' in (await r.actions.nextTurn('scene')))
    assert.equal(r.writes.length, 0)
  }
})
test('preparation with no current activates first ordered entry', async () => {
  const r = rig(rows.map((x) => ({ ...x, is_current: false })))
  assert.ok('success' in (await r.actions.nextTurn('scene')))
  assert.equal(r.rows.find((x) => x.is_current)?.id, 'a')
})

test('stale prepare cannot delete or replace an existing combat', async () => {
  const r = rig(rows)
  assert.ok('error' in (await r.actions.startCombat('scene')))
  assert.deepEqual(r.rows, rows)
  assert.equal(r.writes.length, 0)
})

test('roll-all recalculates once and keeps preparation inactive', async () => {
  const r = rig(rows.map((x) => ({ ...x, is_current: false })))
  assert.ok('success' in (await r.actions.rollAllInitiatives('scene')))
  assert.equal(r.queries.filter((q) => q.orders.join(',') === 'initiative,id').length, 1)
  assert.ok(r.rows.every((row) => !row.is_current))
  assert.ok(r.writes.every((w) => !('is_current' in w.value)))
})
