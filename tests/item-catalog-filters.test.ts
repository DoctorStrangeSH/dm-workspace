import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = ts.transpileModule(
  readFileSync(new URL('../src/lib/actions/items-search.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText

function rig(errorPage?: number) {
  const calls: number[][] = []
  const records = Array.from({ length: 1200 }, (_, index) => ({
    item_type: index < 1000 ? 'Weapon' : 'Wand',
    rarity: index < 1000 ? 'common' : 'legendary',
  }))
  const db = {
    from: (table: string) => {
      assert.equal(table, 'srd_items')
      return {
        select: (columns: string) => {
          assert.equal(columns, 'key, data->>item_type, data->>rarity')
          return {
            order: (key: string) => {
              assert.equal(key, 'key')
              return {
                range: async (start: number, end: number) => {
                  calls.push([start, end])
                  return {
                    data: records.slice(start, end + 1),
                    error: calls.length === errorPage ? 'synthetic failure' : null,
                  }
                },
              }
            },
          }
        },
      }
    },
  }
  const exports: {
    getAvailableItemFilters?: () => Promise<{ types: string[]; rarities: string[] }>
  } = {}
  new Function('require', 'exports', 'console', source)(
    (name: string) => {
      assert.equal(name, '@/lib/supabase/server')
      return { createClient: async () => db }
    },
    exports,
    { error: () => {} }
  )
  return { read: exports.getAvailableItemFilters!, calls }
}

test('actual filter action includes choices beyond the first 1000 catalog rows', async () => {
  const r = rig()
  assert.deepEqual(await r.read(), { types: ['Wand', 'Weapon'], rarities: ['common', 'legendary'] })
  assert.deepEqual(r.calls, [
    [0, 499],
    [500, 999],
    [1000, 1499],
  ])
})

test('a failed metadata page does not present partial filter choices as complete', async () => {
  const r = rig(2)
  assert.deepEqual(await r.read(), { types: [], rarities: [] })
  assert.equal(r.calls.length, 2)
})
