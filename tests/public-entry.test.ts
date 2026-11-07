import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { NextRequest, NextResponse } from 'next/server'
import ts from 'typescript'

const source = ts.transpileModule(
  readFileSync(new URL('../src/proxy.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }
).outputText

function rig(signedIn = false, refresh = false) {
  let checks = 0
  const imports = {
    'next/server': { NextResponse },
    '@supabase/ssr': {
      createServerClient: (
        _url: unknown,
        _key: unknown,
        options: { cookies: { setAll: (cookies: unknown[]) => void } }
      ) => ({
        auth: {
          getUser: async () => {
            checks++
            if (refresh)
              options.cookies.setAll([
                {
                  name: 'test-session',
                  value: 'refreshed',
                  options: { httpOnly: true, path: '/' },
                },
              ])
            return { data: { user: signedIn ? { id: 'synthetic-member' } : null } }
          },
        },
      }),
    },
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: keyof typeof imports) => {
    assert.ok(name in imports, `Unexpected dependency ${name}`)
    return imports[name]
  }, exports)
  return { proxy: exports.proxy as typeof import('../src/proxy').proxy, checks: () => checks }
}

test('guest may reach only the exact public home plus existing auth/license routes', async () => {
  const r = rig()
  for (const route of [
    '/',
    '/?next=/campaign/example',
    '/login?next=/join/example',
    '/signup?next=/join/example',
    '/srd-license',
  ]) {
    const response = await r.proxy(new NextRequest(`https://example.test${route}`))
    assert.equal(response.headers.get('location'), null, route)
  }
  for (const route of [
    '/dashboard',
    '/campaign/example',
    '/campaign/example/scenes/test',
    '/api/private',
    '/join/example',
    '/demo',
    '/welcome',
    '/nested/',
  ]) {
    const response = await r.proxy(new NextRequest(`https://example.test${route}`))
    assert.match(new URL(response.headers.get('location')!).pathname, /^\/login\/?$/, route)
  }
})

test('verified member keeps dashboard entry, private routes and refreshed session cookies', async () => {
  const r = rig(true, true)
  for (const route of ['/', '/login', '/signup']) {
    const response = await r.proxy(new NextRequest(`https://example.test${route}`))
    assert.equal(new URL(response.headers.get('location')!).pathname, '/dashboard')
    assert.equal(response.cookies.get('test-session')?.value, 'refreshed')
    assert.match(response.headers.get('set-cookie')!, /HttpOnly/)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
  assert.equal(
    (await r.proxy(new NextRequest('https://example.test/campaign/example'))).headers.get(
      'location'
    ),
    null
  )
  assert.equal(r.checks(), 4)
})

test('language-only cookies do not grant access and license does not call auth', async () => {
  const r = rig()
  const response = await r.proxy(
    new NextRequest('https://example.test/dashboard', { headers: { cookie: 'dm-lang=en' } })
  )
  assert.equal(new URL(response.headers.get('location')!).pathname, '/login')
  await r.proxy(new NextRequest('https://example.test/srd-license'))
  assert.equal(r.checks(), 1)
})
