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
      if (name === '@/lib/item-catalog') return { ITEM_PAGE_SIZE: 24 }
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

function pageRig(options: { error?: boolean; throws?: boolean; count?: number } = {}) {
  const calls: [string, unknown][] = []
  const db = {
    from: (table: string) => {
      assert.equal(table, 'srd_items')
      const query = {
        select: (value: unknown) => {
          calls.push(['select', value])
          return query
        },
        or: (value: unknown) => {
          calls.push(['or', value])
          return query
        },
        in: (field: string, value: unknown) => {
          calls.push([field, value])
          return query
        },
        order: (value: string) => {
          calls.push(['order', value])
          return query
        },
        range: async (start: number, end: number) => {
          calls.push(['range', [start, end]])
          if (options.throws) throw new Error('offline transport')
          return {
            data: Array.from({ length: options.count ?? 25 }, (_, i) => ({
              key: `item-${start + i}`,
            })),
            error: options.error ? 'offline error' : null,
          }
        },
      }
      return query
    },
  }
  const exports: Record<string, (...args: any[]) => Promise<any>> = {}
  new Function('require', 'exports', 'console', source)(
    (name: string) => {
      if (name === '@/lib/item-catalog') return { ITEM_PAGE_SIZE: 24 }
      assert.equal(name, '@/lib/supabase/server')
      return { createClient: async () => db }
    },
    exports,
    { error: () => {} }
  )
  return { search: exports.searchSrdItemsPageAction, calls }
}

test('page action requests stable order and an inclusive lookahead row after the first 100', async () => {
  const r = pageRig()
  const page = await r.search(
    { query: '  moon,%().*_\\  ', type: ['Wand', 5], rarity: ['rare'] },
    120
  )
  assert.equal(page.ok, true)
  assert.equal(page.items.length, 24)
  assert.equal(page.hasNext, true)
  assert.equal(page.items[0].key, 'item-120')
  assert.deepEqual(r.calls, [
    ['select', '*'],
    ['or', 'name.ilike.%moon %,name_ru.ilike.%moon %'],
    ['data->>item_type', ['Wand']],
    ['data->>rarity', ['rare']],
    ['order', 'name'],
    ['order', 'key'],
    ['range', [120, 144]],
  ])
})

test('page action distinguishes empty/last pages from database and transport failures', async () => {
  assert.deepEqual(await pageRig({ count: 0 }).search(), { ok: true, items: [], hasNext: false })
  assert.equal((await pageRig({ count: 24 }).search()).hasNext, false)
  assert.deepEqual(await pageRig({ error: true }).search(), { ok: false })
  assert.deepEqual(await pageRig({ throws: true }).search(), { ok: false })
  for (const offset of [-1, 1.5, Infinity, '24', 100001]) {
    const r = pageRig()
    assert.deepEqual(await r.search({}, offset), { ok: false })
    assert.deepEqual(r.calls, [])
  }
})

test('a failed metadata page does not present partial filter choices as complete', async () => {
  const r = rig(2)
  assert.deepEqual(await r.read(), { types: [], rarities: [] })
  assert.equal(r.calls.length, 2)
})
