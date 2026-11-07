import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import * as returnPath from '../src/lib/auth/return-path'
import * as dictionaries from '../src/lib/i18n/dictionaries'
import * as jsx from 'react/jsx-runtime'

function load(file: string, imports: Record<string, unknown>) {
  const source = ts.transpileModule(
    readFileSync(new URL('../src/' + file, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, 'Unexpected dependency: ' + name)
    return imports[name]
  }, exports)
  return exports
}

test('post-auth destinations allow application routes and reject external, encoded and looping paths', () => {
  for (const path of [
    '/dashboard',
    '/settings/',
    '/join/abc_123-xy',
    '/join/abc/?a=1#ready',
    '/campaign/uuid/scenes/map?view=table#token',
  ])
    assert.equal(returnPath.safeReturnPath(path), path)
  for (const path of [
    null,
    3,
    '',
    'https://evil.test',
    '//evil.test/join/code',
    'javascript:alert(1)',
    '/\\evil.test',
    '/join/a\nb',
    '/join/%2Fbad',
    '/join/%252Fbad',
    '/campaign/a/../b',
    '/campaign/a/%2e%2e/b',
    '/campaign/a//b',
    '/login',
    '/signup?next=/join/a',
    '/api/private',
    '/unknown',
    '/join/' + 'x'.repeat(129),
    '/dashboard?' + 'x'.repeat(2050),
  ])
    assert.equal(returnPath.safeReturnPath(path), '/dashboard', String(path))
  assert.equal(
    returnPath.authPath('signup', '/join/abc?x=1#ok'),
    '/signup?next=%2Fjoin%2Fabc%3Fx%3D1%23ok'
  )
  assert.equal(returnPath.authPath('login', '//evil.test'), '/login')
  assert.equal(returnPath.inviteReturnPath('/join/abc'), true)
  assert.equal(returnPath.inviteReturnPath('/campaign/abc'), false)
})

function rig(
  signedIn = true,
  data: unknown = '12345678-1234-1234-1234-123456789abc',
  error: unknown = null
) {
  const calls: { name: string; args: unknown }[] = []
  const invalidations: string[] = []
  let clients = 0
  const db = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'synthetic' } : null } }) },
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args })
      return { data, error }
    },
    from: () => {
      throw Error('No table access allowed')
    },
  }
  const imports = {
    '@/lib/auth/return-path': returnPath,
    '@/lib/supabase/server': {
      createClient: async () => {
        clients++
        return db
      },
    },
    'next/cache': { revalidatePath: (path: string) => invalidations.push(path) },
    'node:crypto': {
      randomInt: () => {
        throw Error('Unrelated action called')
      },
    },
  }
  const action = load(
    'lib/actions/campaigns.ts',
    imports
  ) as typeof import('../src/lib/actions/campaigns')
  const page = load('app/join/[code]/page.tsx', {
    ...imports,
    'react/jsx-runtime': jsx,
    'next/server': { connection: async () => {} },
    'next/navigation': {
      redirect: (path: string) => {
        throw Error('REDIRECT:' + path)
      },
    },
    'next/link': { default: () => null },
    'lucide-react': { Dices: () => null, XCircle: () => null },
    '@/components/app-shell': { AppShell: () => null },
    '@/components/ui': { Card: () => null },
    '@/lib/i18n/get-lang': { getLang: async () => 'en' },
    '@/lib/i18n/dictionaries': dictionaries,
    './join-campaign-form': { JoinCampaignForm: () => null },
  }).default as typeof import('../src/app/join/[code]/page').default
  return { action, page, calls, invalidations, clients: () => clients }
}

test('reading/rendering an invite never calls RPC or table access', async () => {
  const r = rig()
  for (let i = 0; i < 2; i++)
    assert.ok(await r.page({ params: Promise.resolve({ code: 'synthetic8' }) }))
  assert.deepEqual(r.calls, [])
  assert.deepEqual(r.invalidations, [])
  const malformed = rig()
  await malformed.page({ params: Promise.resolve({ code: '../invalid' }) })
  assert.equal(malformed.clients(), 0)
  const guest = rig(false)
  await assert.rejects(
    guest.page({ params: Promise.resolve({ code: 'synthetic8' }) }),
    /REDIRECT:\/login\?next=%2Fjoin%2Fsynthetic8/
  )
  assert.deepEqual(guest.calls, [])
})

test('explicit join validates auth/input and calls only the existing membership RPC once', async () => {
  const invalid = rig()
  assert.equal((await invalid.action.joinCampaign('../bad')).code, 'invalid_invite')
  assert.equal(invalid.clients(), 0)
  const guest = rig(false)
  assert.equal((await guest.action.joinCampaign('synthetic8')).code, 'auth_required')
  assert.deepEqual(guest.calls, [])
  const r = rig()
  assert.deepEqual(await r.action.joinCampaign('synthetic8'), {
    success: true,
    campaignId: '12345678-1234-1234-1234-123456789abc',
  })
  assert.deepEqual(r.calls, [{ name: 'join_campaign_by_code', args: { code: 'synthetic8' } }])
  assert.deepEqual(r.invalidations, ['/dashboard'])
})

test('join distinguishes rejected invites, ended sessions and uncertain outcomes without retry', async () => {
  for (const [error, expected] of [
    [{ code: '22023' }, 'invalid_invite'],
    [{ code: '42501' }, 'auth_required'],
    [{ code: '504' }, 'uncertain'],
  ] as const) {
    const r = rig(true, null, error)
    assert.equal((await r.action.joinCampaign('synthetic8')).code, expected)
    assert.equal(r.calls.length, 1)
    assert.deepEqual(r.invalidations, [])
  }
  for (const response of [null, {}, [], 'not-a-uuid']) {
    const r = rig(true, response)
    assert.equal((await r.action.joinCampaign('synthetic8')).code, 'uncertain')
    assert.equal(r.calls.length, 1)
    assert.deepEqual(r.invalidations, [])
  }
})
