import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import * as page from '../src/lib/srd/catalog-page'

function rig(
  kind: 'spells' | 'bestiary',
  options: { error?: boolean; throws?: boolean; count?: number } = {}
) {
  const calls: [string, unknown][] = []
  const query = {
    select: (value: string) => {
      calls.push(['select', value])
      return query
    },
    order: (value: string) => {
      calls.push(['order', value])
      return query
    },
    in: (key: string, value: unknown) => {
      calls.push([key, value])
      return query
    },
    or: (value: string) => {
      calls.push(['or', value])
      return query
    },
    range: async (start: number, end: number) => {
      calls.push(['range', [start, end]])
      if (options.throws) throw new Error('Offline transport')
      const records = Array.from({ length: options.count ?? 200 }, (_, i) => ({
        key: `entry-${i}`,
        name: `Entry ${i}`,
        name_ru: null,
        data:
          kind === 'spells'
            ? { school: 'Evocation', level: '0' }
            : { cr: '1/8', type: 'dragon', size: 'large' },
      }))
      const matching = records.filter((row) =>
        calls
          .filter(([key]) => key.startsWith('data->>'))
          .every(([key, values]) =>
            (values as string[]).includes(row.data[key.slice(7) as keyof typeof row.data] as string)
          )
      )
      return {
        data: matching.slice(start, end + 1),
        error: options.error ? 'Offline failure' : null,
      }
    },
  }
  const source = ts.transpileModule(
    readFileSync(new URL(`../src/lib/actions/${kind}-search.ts`, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText
  const exports: Record<string, (...args: any[]) => Promise<any>> = {}
  new Function('require', 'exports', 'console', source)(
    (name: string) => {
      if (name === '@/lib/srd/catalog-page') return page
      if (name === 'next/cache') return { unstable_cache: (fn: unknown) => fn }
      if (name === '@/lib/supabase/srd')
        return {
          createSrdClient: () => {
            throw new Error('Unexpected cached client')
          },
        }
      assert.equal(name, '@/lib/supabase/server')
      return {
        createClient: async () => ({
          from: (table: string) => {
            calls.push(['table', table])
            return query
          },
        }),
      }
    },
    exports,
    { error: () => {} }
  )
  return {
    read: exports[kind === 'spells' ? 'searchSrdSpellsPageAction' : 'searchSrdMonstersPageAction'],
    calls,
  }
}

test('spell school chips match retained title-case Open5e rows and preserve cantrip level zero', async () => {
  const r = rig('spells')
  const result = await r.read({ school: ['evocation'], level: [0, -1, 10, '0'] }, 120)
  assert.equal(result.ok, true)
  assert.equal(result.items.length, 24)
  assert.equal(result.items[0].key, 'entry-120')
  assert.equal(result.hasNext, true)
  assert.deepEqual(r.calls, [
    ['table', 'srd_spells'],
    ['select', '*'],
    ['data->>level', ['0']],
    ['data->>school', ['evocation', 'Evocation']],
    ['order', 'name'],
    ['order', 'key'],
    ['range', [120, 144]],
  ])
})

test('monster page preserves fractional CR, type/size, stable ordering and lookahead', async () => {
  const r = rig('bestiary')
  const result = await r.read({ cr: ['1/8'], type: ['dragon'], size: ['large'] }, 120)
  assert.equal(result.items.length, 24)
  assert.equal(result.hasNext, true)
  assert.deepEqual(r.calls, [
    ['table', 'srd_monsters'],
    ['select', '*'],
    ['data->>cr', ['1/8']],
    ['data->>type', ['dragon']],
    ['data->>size', ['large']],
    ['order', 'name'],
    ['order', 'key'],
    ['range', [120, 144]],
  ])
})

for (const kind of ['spells', 'bestiary'] as const) {
  test(`${kind} page distinguishes empty/last results from failures and rejects unsafe offsets`, async () => {
    assert.deepEqual(await rig(kind, { count: 0 }).read(), { ok: true, items: [], hasNext: false })
    assert.equal((await rig(kind, { count: 24 }).read()).hasNext, false)
    assert.deepEqual(await rig(kind, { error: true }).read(), { ok: false })
    assert.deepEqual(await rig(kind, { throws: true }).read(), { ok: false })
    for (const offset of [-1, 0.5, NaN, Infinity, 100001, '24']) {
      const r = rig(kind)
      assert.deepEqual(await r.read({}, offset), { ok: false })
      assert.deepEqual(r.calls, [])
    }
    const r = rig(kind)
    await r.read({ query: 'moon,%().*_\\', type: [7, null], school: [false] })
    assert.deepEqual(
      r.calls.find(([key]) => key === 'or'),
      ['or', 'name.ilike.%moon %,name_ru.ilike.%moon %']
    )
  })
}
