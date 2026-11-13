import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = ts.transpileModule(
  readFileSync(new URL('../src/lib/actions/templates.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText

function rig({ dm = true, found = true, fail = false } = {}) {
  const calls: unknown[][] = []
  const paths: string[] = []
  const entity = { type: 'npc', description: 'Secret description', data_json: { secret: 'goal' } }
  const db = {
    from(table: string) {
      calls.push(['from', table])
      let deleting = false
      const query = {
        select: (columns: string) => {
          calls.push(['select', table, columns])
          return query
        },
        eq: (key: string, value: unknown) => {
          calls.push(['eq', table, key, value])
          return query
        },
        insert: (value: unknown) => {
          calls.push(['insert', table, value])
          return query
        },
        delete: () => {
          deleting = true
          calls.push(['delete', table])
          return query
        },
        single: async () => ({
          data: fail ? null : { id: 'template' },
          error: fail ? { code: '42501' } : null,
        }),
        maybeSingle: async () => ({
          data: found ? (deleting ? { id: 'template' } : entity) : null,
          error: null,
        }),
      }
      return query
    },
  }
  const imports: Record<string, unknown> = {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/queries/access': { getCampaignAccess: async () => ({ isDm: dm }) },
    'next/cache': { revalidatePath: (path: string) => paths.push(path) },
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, `Unexpected live dependency ${name}`)
    return imports[name]
  }, exports)
  return { actions: exports as typeof import('../src/lib/actions/templates'), calls, paths, entity }
}

test('template actions deny players before opening a database write boundary', async () => {
  const { actions, calls } = rig({ dm: false })
  assert.ok((await actions.createTemplateFromEntity('entity', 'campaign', 'Name')).error)
  assert.ok((await actions.deleteTemplate('template', 'campaign')).error)
  assert.deepEqual(calls, [])
})
test('template creation scopes the source, copies only its snapshot and refreshes the actual library', async () => {
  const { actions, calls, paths, entity } = rig()
  assert.equal(
    (await actions.createTemplateFromEntity('entity', 'campaign', '  Name  ')).success,
    true
  )
  assert.ok(
    calls.some(
      (call) =>
        JSON.stringify(call) === JSON.stringify(['eq', 'entities', 'campaign_id', 'campaign'])
    )
  )
  assert.deepEqual(
    calls.find((call) => call[0] === 'insert'),
    [
      'insert',
      'entity_templates',
      {
        campaign_id: 'campaign',
        type: entity.type,
        name: 'Name',
        description: entity.description,
        data_json: entity.data_json,
        is_builtin: false,
      },
    ]
  )
  assert.deepEqual(paths, ['/campaign/campaign/entities'])
})
test('missing or foreign source and invalid names never insert a template', async () => {
  for (const name of ['', ' ', 'x'.repeat(101)]) {
    const r = rig()
    assert.ok((await r.actions.createTemplateFromEntity('entity', 'campaign', name)).error)
    assert.equal(r.calls.length, 0)
  }
  const r = rig({ found: false })
  assert.ok((await r.actions.createTemplateFromEntity('foreign', 'campaign', 'Name')).error)
  assert.equal(
    r.calls.some((call) => call[0] === 'insert'),
    false
  )
  assert.deepEqual(r.paths, [])
})
test('template deletion is campaign-scoped and never deletes a builtin', async () => {
  const { actions, calls, paths } = rig()
  assert.equal((await actions.deleteTemplate('template', 'campaign')).success, true)
  assert.ok(
    calls.some(
      (call) =>
        JSON.stringify(call) ===
        JSON.stringify(['eq', 'entity_templates', 'campaign_id', 'campaign'])
    )
  )
  assert.ok(
    calls.some(
      (call) =>
        JSON.stringify(call) === JSON.stringify(['eq', 'entity_templates', 'is_builtin', false])
    )
  )
  assert.deepEqual(paths, ['/campaign/campaign/entities'])
})
