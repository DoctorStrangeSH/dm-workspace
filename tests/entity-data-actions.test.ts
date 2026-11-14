import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { test } from 'node:test'
import ts from 'typescript'
import { createClient } from '@supabase/supabase-js'
import * as objectives from '../src/lib/quest-objectives'

const source = ts.transpileModule(
  readFileSync(new URL('../src/lib/actions/entities.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText
const original = {
  status: 'active',
  notes: 'preserve me',
  objectives: [{ id: 'one', text: 'Tower', done: false }],
}
function rig({ dm = true, fail = false } = {}) {
  let stored = structuredClone(original)
  const calls: { url: URL; body: Record<string, unknown> }[] = []
  const paths: string[] = []
  // The real SDK encodes the request; this in-memory Data API boundary never calls a network.
  const db = createClient('https://offline.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input))
        const body = JSON.parse(String(init?.body))
        calls.push({ url, body })
        if (fail)
          return new Response(JSON.stringify({ message: 'Synthetic denied' }), { status: 403 })
        const matches =
          url.searchParams.get('id') === 'eq.quest' &&
          url.searchParams.get('campaign_id') === 'eq.campaign' &&
          (!('data_json' in body) ||
            isDeepStrictEqual(JSON.parse(url.searchParams.get('data_json')!.slice(3)), stored))
        if (matches && body.data_json) stored = body.data_json
        return new Response(JSON.stringify(matches ? { id: 'quest' } : null), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  })
  const imports: Record<string, unknown> = {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/queries/access': { getCampaignAccess: async () => ({ isDm: dm }) },
    '@/lib/quest-objectives': objectives,
    'next/cache': { revalidatePath: (path: string) => paths.push(path) },
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports)
    return imports[name]
  }, exports)
  return {
    actions: exports as typeof import('../src/lib/actions/entities'),
    calls,
    paths,
    stored: () => stored,
  }
}
test('players and invalid objective payloads never reach a database write', async () => {
  const denied = rig({ dm: false })
  assert.ok(
    (await denied.actions.updateEntity('quest', 'campaign', { data_json: original }, original))
      .error
  )
  assert.equal(denied.calls.length, 0)
  for (const value of [null, 'old', [{ id: 'one', text: 'x', done: 'yes' }]]) {
    const r = rig()
    assert.ok(
      (
        await r.actions.updateEntity(
          'quest',
          'campaign',
          { data_json: { ...original, objectives: value } },
          original
        )
      ).error
    )
    assert.equal(r.calls.length, 0)
  }
  const r = rig()
  assert.ok((await r.actions.updateEntity('quest', 'campaign', { data_json: original })).error)
  assert.equal(r.calls.length, 0)
})
test('real SDK sends campaign-scoped JSON equality; a stale tab cannot revert another completion', async () => {
  const r = rig()
  const completed = { ...original, objectives: [{ ...original.objectives[0], done: true }] }
  assert.equal(
    (await r.actions.updateEntity('quest', 'campaign', { data_json: completed }, original)).success,
    true
  )
  assert.deepEqual(r.calls[0].body, { data_json: completed })
  assert.equal(r.calls[0].url.searchParams.get('data_json'), `eq.${JSON.stringify(original)}`)
  assert.deepEqual(r.paths, ['/campaign/campaign/entities', '/campaign/campaign/entities/quest'])
  assert.ok(
    (
      await r.actions.updateEntity(
        'quest',
        'campaign',
        { data_json: { ...original, reward: 'stale edit' } },
        original
      )
    ).error
  )
  assert.deepEqual(r.stored(), completed)
  assert.equal(r.paths.length, 2)
  assert.equal(
    (
      await r.actions.updateEntity(
        'quest',
        'campaign',
        { data_json: { ...completed, reward: 'fresh' } },
        completed
      )
    ).success,
    true
  )
  assert.equal(r.stored().notes, original.notes)
})
test('foreign entities, runtime field injection and database failures are not success', async () => {
  const r = rig()
  assert.ok(
    (await r.actions.updateEntity('foreign', 'campaign', { data_json: original }, original)).error
  )
  assert.ok(
    (await r.actions.updateEntity('quest', 'foreign-campaign', { data_json: original }, original))
      .error
  )
  assert.equal(
    (
      await r.actions.updateEntity('quest', 'campaign', {
        name: 'Name',
        campaign_id: 'foreign',
      } as never)
    ).success,
    true
  )
  assert.deepEqual(r.calls.at(-1)?.body, { name: 'Name' })
  const failure = rig({ fail: true })
  assert.ok(
    (await failure.actions.updateEntity('quest', 'campaign', { data_json: original }, original))
      .error
  )
  assert.deepEqual(failure.paths, [])
})
