import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function loadModule(path: string, imports: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, 'unexpected real dependency: ' + name)
    return imports[name]
  }, exports)
  return exports
}

function rig(
  userId: string | null = 'authenticated-viewer',
  role: string | null = 'player',
  campaignExists = true
) {
  const reads: { table: string; key: string; value: unknown }[] = []
  const writes: { table: string; value: unknown; options: unknown }[] = []
  const refreshed: string[] = []
  let authCalls = 0
  const db = {
    auth: {
      getUser: async () => {
        authCalls++
        return { data: { user: userId ? { id: userId } : null } }
      },
    },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          reads.push({ table, key, value })
          return query
        },
        single: async () => ({
          data:
            table === 'campaigns'
              ? campaignExists
                ? { id: 'campaign', name: 'Test' }
                : null
              : table === 'campaign_members'
                ? role
                  ? { role }
                  : null
                : { campaign_id: 'campaign' },
        }),
        upsert: async (value: unknown, options: unknown) => {
          writes.push({ table, value, options })
          return { error: null }
        },
      }
      return query
    },
  }
  const access = loadModule('../src/lib/queries/access.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
  }) as typeof import('../src/lib/queries/access')
  const actions = loadModule('../src/lib/actions/sessions.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/queries/access': access,
    'next/cache': { revalidatePath: (path: string) => refreshed.push(path) },
  }) as typeof import('../src/lib/actions/sessions')
  return { access, actions, reads, writes, refreshed, authCalls: () => authCalls }
}

test('campaign display identity comes from authenticated getUser, without a browsing write or extra auth call', async () => {
  for (const role of ['player', 'dm']) {
    const r = rig('server-viewer', role)
    const result = await r.access.getCampaignAccess('campaign')
    assert.equal(result.viewerId, 'server-viewer')
    assert.equal(result.isDm, role === 'dm')
    assert.equal(result.isMember, true)
    assert.equal(r.authCalls(), 1)
    assert.ok(
      r.reads.some(
        (read) =>
          read.table === 'campaign_members' &&
          read.key === 'user_id' &&
          read.value === 'server-viewer'
      )
    )
    assert.deepEqual(r.writes, [])
  }
})

test('missing auth or campaign exposes no display identity and never writes', async () => {
  for (const r of [rig(null), rig('viewer', 'player', false)]) {
    const result = await r.access.getCampaignAccess('campaign')
    assert.equal(result.viewerId, null)
    assert.equal(result.isMember, false)
    assert.deepEqual(r.writes, [])
  }
  const signedOut = rig(null)
  await signedOut.access.getCampaignAccess('campaign')
  assert.deepEqual(signedOut.reads, [])
})

test('RSVP writes retain server identity and membership authority regardless of extra client identity', async () => {
  for (const status of ['yes', 'maybe', 'no'] as const) {
    const r = rig('real-writer')
    const result = await Reflect.apply(r.actions.setRsvp, null, [
      'session',
      status,
      'forged-viewer',
    ])
    assert.deepEqual(result, { success: true })
    assert.equal(r.writes.length, 1)
    const write = r.writes[0]
    assert.equal(write.table, 'session_rsvp')
    assert.deepEqual(write.options, { onConflict: 'session_id,user_id' })
    assert.deepEqual(
      { ...(write.value as object), updated_at: 'ignored-time' },
      {
        session_id: 'session',
        user_id: 'real-writer',
        status,
        updated_at: 'ignored-time',
      }
    )
    assert.deepEqual(r.refreshed, ['/campaign/campaign/sessions'])
  }
  for (const r of [rig(null), rig('outsider', null)]) {
    assert.ok('error' in (await r.actions.setRsvp('session', 'yes')))
    assert.deepEqual(r.writes, [])
    assert.deepEqual(r.refreshed, [])
  }
})
