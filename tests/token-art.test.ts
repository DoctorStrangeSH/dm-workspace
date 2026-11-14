import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as art from '../src/lib/maps/token-art'

const campaign = '11111111-1111-4111-8111-111111111111'
const scene = '22222222-2222-4222-8222-222222222222'
const id = '33333333-3333-4333-8333-333333333333'
const path = `${campaign}/${scene}/${id}/44444444-4444-4444-8444-444444444444.png`
const png = () =>
  new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], 'art.png', {
    type: 'image/png',
  })

function rig(
  options: {
    dm?: boolean
    member?: boolean
    owner?: string
    exists?: boolean
    conflict?: boolean
    uploadFail?: boolean
    writeFail?: boolean
    image?: string | null
    hidden?: boolean
  } = {}
) {
  const calls: { url: URL; method: string; body: unknown }[] = []
  const paths: string[] = []
  const token = {
    id,
    scene_id: scene,
    campaign_id: campaign,
    owner_id: options.owner ?? 'self',
    image_url: options.image ?? null,
    is_hidden: options.hidden ?? false,
  }
  const db = createClient('https://offline.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input))
        const method = init?.method ?? 'GET'
        let body: unknown = init?.body
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body)
          } catch {}
        }
        calls.push({ url, method, body })
        if (url.pathname.startsWith('/storage/v1/object/sign/'))
          return Response.json({ signedURL: '/object/sign/token-art/example?token=synthetic' })
        if (url.pathname.startsWith('/storage/'))
          return options.uploadFail
            ? Response.json({ message: 'denied' }, { status: 403 })
            : Response.json({ Key: path, Id: 'upload' })
        if (method === 'PATCH')
          return options.writeFail
            ? Response.json({ message: 'denied' }, { status: 403 })
            : Response.json(options.conflict ? null : { id })
        const matches =
          options.exists !== false &&
          url.searchParams.get('id') === `eq.${id}` &&
          (!url.searchParams.has('scene_id') || url.searchParams.get('scene_id') === `eq.${scene}`)
        return Response.json(matches ? token : null)
      },
    },
  })
  db.auth.getUser = async () =>
    ({ data: { user: { id: 'self' } }, error: null }) as Awaited<ReturnType<typeof db.auth.getUser>>
  const imports: Record<string, unknown> = {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/queries/access': {
      getCampaignAccess: async () => ({
        isDm: options.dm ?? true,
        isMember: options.member ?? true,
      }),
    },
    '@/lib/maps/token-art': art,
    'next/cache': { revalidatePath: (value: string) => paths.push(value) },
    'next/server': { NextResponse },
  }
  function load(relative: string) {
    const source = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const exports: Record<string, unknown> = {}
    new Function('require', 'exports', source)((name: string) => {
      assert.ok(name in imports, name)
      return imports[name]
    }, exports)
    return exports
  }
  return {
    calls,
    paths,
    action: load(
      '../src/lib/actions/token-art.ts'
    ) as typeof import('../src/lib/actions/token-art'),
    route: load(
      '../src/app/api/tokens/[id]/art/route.ts'
    ) as typeof import('../src/app/api/tokens/[id]/art/route'),
  }
}

test('private art paths bind scene and token; legacy web images remain supported', () => {
  assert.equal(art.tokenArtPath(path, campaign, scene, id), path)
  for (const value of [
    path + '/x',
    '../' + path,
    path.replace(scene, campaign),
    'https://evil.test/' + path,
  ])
    assert.equal(art.tokenArtPath(value, campaign, scene, id), null)
  const token = { id, scene_id: scene, image_url: path }
  assert.match(art.tokenArtSrc(token)!, new RegExp(`^/api/tokens/${id}/art\\?v=`))
  assert.equal(
    art.tokenArtSrc({ ...token, image_url: 'https://example.com/a.png' }),
    'https://example.com/a.png'
  )
  for (const value of ['javascript:alert(1)', '/wrong-path', 'data:image/svg+xml,<svg>'])
    assert.equal(art.tokenArtSrc({ ...token, image_url: value }), null)
})

test('file validation checks actual signatures before any database request', async () => {
  for (const file of [
    new File(['<svg/>'], 'a.png', { type: 'image/png' }),
    new File([new Uint8Array(art.TOKEN_ART_LIMIT + 1)], 'a.png', { type: 'image/png' }),
    new File([], 'a.png', { type: 'image/png' }),
  ]) {
    const r = rig()
    assert.ok((await r.action.uploadTokenArt(id, scene, null, file)).error)
    assert.equal(r.calls.length, 0)
  }
  assert.equal(art.tokenArtFormat(new Uint8Array([255, 216, 255]), 'image/png'), null)
  assert.equal(art.tokenArtFormat(new Uint8Array([255, 216, 255]), 'image/jpeg'), 'jpg')
  assert.equal(art.tokenArtFormat(new TextEncoder().encode('RIFFabcdWEBP'), 'image/webp'), 'webp')
})

test('outsiders, foreign scenes, nonowners and stale images cannot upload', async () => {
  for (const options of [
    { member: false },
    { dm: false, owner: 'other' },
    { exists: false },
    { image: path },
  ]) {
    const r = rig(options)
    assert.ok((await r.action.uploadTokenArt(id, scene, null, png())).error)
    assert.equal(
      r.calls.some((call) => call.method !== 'GET'),
      false
    )
  }
  const r = rig()
  assert.ok((await r.action.uploadTokenArt(id, campaign, null, png())).error)
  assert.equal(r.calls.length, 1)
})

test('upload is immutable; owner save writes only image with scoped expected-image equality', async () => {
  const r = rig({ dm: false })
  const result = await r.action.uploadTokenArt(id, scene, null, png())
  assert.ok(result.success)
  const upload = r.calls.find((call) => call.url.pathname.startsWith('/storage/'))!
  assert.match(upload.url.pathname, new RegExp(`/token-art/${campaign}/${scene}/${id}/`))
  const write = r.calls.find((call) => call.method === 'PATCH')!
  assert.deepEqual(Object.keys(write.body as object), ['image_url'])
  for (const [key, value] of Object.entries({
    id: `eq.${id}`,
    scene_id: `eq.${scene}`,
    campaign_id: `eq.${campaign}`,
    image_url: 'is.null',
  }))
    assert.equal(write.url.searchParams.get(key), value)
  assert.deepEqual(r.paths, [`/campaign/${campaign}/scenes/${scene}`])
  assert.equal(
    r.calls.some((call) => call.method === 'DELETE'),
    false
  )
})

test('storage errors and concurrent replacements never report success or delete uncertain art', async () => {
  for (const options of [{ uploadFail: true }, { conflict: true }, { writeFail: true }]) {
    const r = rig(options)
    assert.ok((await r.action.uploadTokenArt(id, scene, null, png())).error)
    assert.equal(r.paths.length, 0)
    assert.equal(
      r.calls.some((call) => call.method === 'DELETE'),
      false
    )
    if (options.uploadFail)
      assert.equal(
        r.calls.some((call) => call.method === 'PATCH'),
        false
      )
  }
  const r = rig({ image: path })
  assert.ok((await r.action.uploadTokenArt(id, scene, path, png())).success)
  assert.equal(
    r.calls.find((call) => call.method === 'PATCH')!.url.searchParams.get('image_url'),
    `eq.${path}`
  )
})

test('private route denies hidden art to players and outsiders without signing', async () => {
  for (const options of [
    { member: false },
    { dm: false, hidden: true },
    { exists: false },
    { image: path.replace(scene, campaign) },
  ]) {
    const r = rig({ image: path, ...options })
    const response = await r.route.GET(new Request('https://offline.invalid'), {
      params: Promise.resolve({ id }),
    })
    assert.equal(response.status, 404)
    assert.match(response.headers.get('cache-control')!, /no-store/)
    assert.equal(
      r.calls.some((call) => call.url.pathname.includes('/sign/')),
      false
    )
  }
})

test('visible member art signs only the stored current path and prevents cache sharing', async () => {
  const r = rig({ dm: false, image: path })
  const response = await r.route.GET(new Request('https://offline.invalid?v=untrusted'), {
    params: Promise.resolve({ id }),
  })
  assert.equal(response.status, 302)
  assert.match(response.headers.get('cache-control')!, /private, no-store/)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  const sign = r.calls.find((call) => call.url.pathname.includes('/sign/'))!
  assert.ok(sign.url.pathname.endsWith('/token-art/' + path))
  assert.deepEqual(sign.body, { expiresIn: 60 })
})
