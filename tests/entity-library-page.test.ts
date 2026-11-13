import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as jsx from 'react/jsx-runtime'
import ts from 'typescript'
import { ENTITY_FILTERS } from '../src/lib/entity-ui'

const source = ts.transpileModule(
  readFileSync(new URL('../src/app/campaign/[id]/entities/page.tsx', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }
).outputText

function rig({ dm = true, member = true, found = true, failAt = -1, total = 3, cap = 500 } = {}) {
  const calls: unknown[][] = []
  const query = {
    select(...args: unknown[]) {
      calls.push(['select', ...args])
      return query
    },
    eq(...args: unknown[]) {
      calls.push(['eq', ...args])
      return query
    },
    order(...args: unknown[]) {
      calls.push(['order', ...args])
      return query
    },
    async range(from: number, to: number) {
      calls.push(['range', from, to])
      return {
        data: Array.from(
          { length: Math.max(0, Math.min(cap, total - from, to - from + 1)) },
          (_, i) => ({ id: String(from + i) })
        ),
        error: from === failAt ? { code: 'TEST' } : null,
        count: total,
      }
    },
  }
  const imports: Record<string, unknown> = {
    'react/jsx-runtime': jsx,
    'next/server': { connection: async () => {} },
    'next/navigation': {
      notFound() {
        throw Error('not-found')
      },
      redirect() {
        throw Error('redirect')
      },
    },
    '@/lib/supabase/server': {
      createClient: async () => ({
        from(table: string) {
          calls.push(['from', table])
          return query
        },
      }),
    },
    '@/lib/queries/access': {
      getCampaignAccess: async () => ({
        campaign: found ? { name: 'Test' } : null,
        isDm: dm,
        isMember: member,
      }),
    },
    '@/lib/queries/backlinks': { getBacklinksCounts: async () => ({}) },
    '@/lib/queries/templates': {
      getTemplatesForCampaign: async () => {
        calls.push(['templates'])
        return []
      },
    },
    '@/components/breadcrumbs': { Breadcrumbs: 'breadcrumbs' },
    '@/lib/entity-ui': { ENTITY_FILTERS },
    '@/lib/i18n/get-lang': { getLang: async () => 'en' },
    '@/lib/i18n/dictionaries': { getDictionary: () => ({}), createT: () => (key: string) => key },
    './entities-workspace': { default: 'workspace' },
  }
  const exports: any = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, `Unexpected external dependency ${name}`)
    return imports[name]
  }, exports)
  return {
    calls,
    render: (type?: string) =>
      exports.default({
        params: Promise.resolve({ id: 'campaign' }),
        searchParams: Promise.resolve({ type }),
      }),
  }
}

test('library page preserves campaign and visibility constraints and omits private payload fields', async () => {
  const r = rig({ dm: false })
  const view = await r.render('note')
  assert.ok(
    r.calls.some(
      (call) => JSON.stringify(call) === JSON.stringify(['eq', 'campaign_id', 'campaign'])
    )
  )
  assert.ok(
    r.calls.some(
      (call) => JSON.stringify(call) === JSON.stringify(['eq', 'is_visible_to_players', true])
    )
  )
  assert.deepEqual(
    r.calls.find((call) => call[0] === 'select'),
    ['select', 'id,type,name,description,is_visible_to_players,updated_at', { count: 'exact' }]
  )
  assert.equal(
    r.calls.some((call) => call[0] === 'templates'),
    false
  )
  assert.equal(view.props.children[1].props.initialType, 'note')
})

test('library follows server row caps and returns all card pages, including older types', async () => {
  const r = rig({ total: 1003, cap: 200 })
  const view = await r.render('invalid')
  assert.equal(view.props.children[1].props.entities.length, 1003)
  assert.equal(view.props.children[1].props.initialType, 'all')
  assert.deepEqual(
    r.calls.filter((call) => call[0] === 'range').map((call) => call[1]),
    [0, 200, 400, 600, 800, 1000]
  )
})

test('library errors fail to retry boundary instead of showing partial or empty success', async () => {
  await assert.rejects(rig({ failAt: 500, total: 501 }).render(), /Unable to load/)
})

test('missing campaign and nonmembers cannot open library queries', async () => {
  for (const options of [{ found: false }, { member: false }]) {
    const r = rig(options)
    await assert.rejects(r.render(), /not-found|redirect/)
    assert.deepEqual(r.calls, [])
  }
})
