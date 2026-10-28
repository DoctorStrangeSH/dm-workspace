import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { DEV_URL, main, runHPCheck } from '../scripts/test-dev-hp-concurrency.mjs'

const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const fixture = {
  campaignId: id(1),
  characterId: id(2),
  startHP: 20,
  maxHP: 20,
  inventoryEvidence: 'Synthetic test inventory; no live data',
  tokens: [
    { id: id(3), sceneId: id(5) },
    { id: id(4), sceneId: id(6) },
  ],
}
const environment = {
  DEV_SUPABASE_URL: DEV_URL,
  DEV_SUPABASE_ANON_KEY: 'fake-anon',
  DEV_TEST_JWT_A: 'fake-a',
  DEV_TEST_JWT_B: 'fake-b',
}

function simulation(options = {}) {
  const calls = []
  const state = {
    campaign: { id: id(1), name: 'HP-DEV-TEST-campaign' },
    character: {
      id: id(2),
      campaign_id: id(1),
      name: 'HP-DEV-TEST-character',
      data_json: { hp: { current: 20, max: 20, temp: 0 }, inventory: ['unchanged'] },
    },
    tokens: fixture.tokens.map((t) => ({
      id: t.id,
      scene_id: t.sceneId,
      campaign_id: id(1),
      character_id: id(2),
      hp_current: 20,
      hp_max: 20,
    })),
  }
  options.setup?.(state)
  let waiting
  let count = 0
  const fetchImpl = async (url, config) => {
    assert.ok(url.startsWith(DEV_URL + '/'))
    assert.equal(config.redirect, 'error')
    assert.ok(config.signal)
    calls.push({ url, config })
    const userB = config.headers.Authorization === 'Bearer fake-b'
    const parsed = new URL(url)
    let value
    if (parsed.pathname === '/auth/v1/user')
      value = { id: options.sameUser ? id(10) : id(userB ? 11 : 10) }
    else if (parsed.pathname.endsWith('/rpc/apply_token_hp_atomic')) {
      assert.equal(config.method, 'POST')
      count++
      // First request cannot finish until the second has entered the adapter.
      // A sequential caller would time out this test.
      if (count === 1)
        await new Promise((resolve) => {
          waiting = resolve
        })
      else waiting()
      const body = JSON.parse(config.body)
      assert.equal(body.p_expected_hp, null)
      state.character.data_json.hp.current -= body.p_amount
      for (const token of state.tokens) {
        if (!options.staleSibling || token.id === body.p_token_id)
          token.hp_current = state.character.data_json.hp.current
      }
      if (options.corruptJSON) state.character.data_json.inventory = []
      if (options.failAfterCommit) throw new Error('sensitive-remote-error fake-a')
      value = options.badResponse
        ? { secret: 'never-print-this' }
        : state.character.data_json.hp.current
    } else {
      assert.equal(config.method, 'GET')
      if (options.unreadableAfter && count) return { ok: false, status: 403 }
      if (parsed.pathname.endsWith('/campaigns')) value = [state.campaign]
      else if (parsed.pathname.endsWith('/characters')) value = [state.character]
      else if (parsed.pathname.endsWith('/tokens')) {
        assert.equal(parsed.searchParams.get('character_id'), 'eq.' + id(2))
        assert.equal(parsed.searchParams.get('campaign_id'), null)
        value = options.hiddenForB && userB ? [state.tokens[0]] : state.tokens
      } else assert.fail('Unexpected network endpoint')
      if (options.differentSnapshot && userB && parsed.pathname.endsWith('/characters')) {
        value = structuredClone(value)
        value[0].data_json.inventory = ['different']
      }
    }
    const copied = structuredClone(value)
    return { ok: true, status: 200, json: async () => copied }
  }
  return { calls, state, fetchImpl }
}
const check = (sim, overrides = {}) =>
  runHPCheck({
    env: environment,
    fixture: structuredClone(fixture),
    fetchImpl: sim.fetchImpl,
    ...overrides,
  })
const mutate = (sim) =>
  check(sim, {
    allowMutation: true,
    checkpoint: async () => {},
    env: { ...environment, DEV_HP_ALLOW_MUTATION: 'true' },
  })
const posts = (sim) => sim.calls.filter((c) => c.config.method === 'POST')

test('default preflight uses only GET, captures every token, and makes no HP claim', async () => {
  const sim = simulation()
  const report = await check(sim)
  assert.equal(report.mode, 'dry-run')
  assert.equal(report.mutationAttempted, false)
  assert.equal(report.before.tokens.length, 2)
  assert.equal(report.passed, true)
  assert.equal(posts(sim).length, 0)
  assert.match(report.visibilityCaveat, /do not prove completeness/)
})

test('environment opt-in alone remains read-only', async () => {
  const sim = simulation()
  await check(sim, { env: { ...environment, DEV_HP_ALLOW_MUTATION: 'true' } })
  assert.equal(posts(sim).length, 0)
})

test('CLI opt-in alone fails before network', async () => {
  const sim = simulation()
  await assert.rejects(check(sim, { allowMutation: true }), /both/)
  assert.equal(sim.calls.length, 0)
})

for (const badURL of ['https://production.supabase.co', DEV_URL + '/', DEV_URL + '.evil.test']) {
  test('rejects unpinned host ' + badURL, async () => {
    const sim = simulation()
    await assert.rejects(
      check(sim, { env: { ...environment, DEV_SUPABASE_URL: badURL } }),
      /pinned/
    )
    assert.equal(sim.calls.length, 0)
  })
}

for (const [label, change] of [
  [
    'one token',
    (f) => {
      f.tokens.pop()
    },
  ],
  [
    'duplicate tokens',
    (f) => {
      f.tokens[1] = f.tokens[0]
    },
  ],
  [
    'bad UUID',
    (f) => {
      f.characterId = 'unsafe&filter=eq.any'
    },
  ],
  [
    'no inventory evidence',
    (f) => {
      f.inventoryEvidence = ''
    },
  ],
  [
    'insufficient HP',
    (f) => {
      f.startHP = 6
    },
  ],
  [
    'fractional HP',
    (f) => {
      f.startHP = 19.5
    },
  ],
]) {
  test('rejects invalid fixture before network: ' + label, async () => {
    const sim = simulation()
    const invalid = structuredClone(fixture)
    change(invalid)
    await assert.rejects(check(sim, { fixture: invalid }))
    assert.equal(sim.calls.length, 0)
  })
}

for (const [label, options] of [
  ['same authenticated identity', { sameUser: true }],
  ['hidden sibling for second user', { hiddenForB: true }],
  ['different character JSON', { differentSnapshot: true }],
  [
    'non-disposable campaign',
    {
      setup: (s) => {
        s.campaign.name = 'Player campaign'
      },
    },
  ],
  [
    'pre-existing sibling drift',
    {
      setup: (s) => {
        s.tokens[1].hp_current = 19
      },
    },
  ],
  [
    'unexpected third token',
    {
      setup: (s) => {
        s.tokens.push({ ...s.tokens[0], id: id(99) })
      },
    },
  ],
  [
    'foreign campaign sibling',
    {
      setup: (s) => {
        s.tokens[1].campaign_id = id(99)
      },
    },
  ],
  [
    'wrong scene',
    {
      setup: (s) => {
        s.tokens[1].scene_id = id(99)
      },
    },
  ],
  [
    'unexpected initial max',
    {
      setup: (s) => {
        s.character.data_json.hp.max = 21
        s.tokens.forEach((t) => {
          t.hp_max = 21
        })
      },
    },
  ],
]) {
  test('refuses mutation on unsafe preflight: ' + label, async () => {
    const sim = simulation(options)
    await assert.rejects(mutate(sim))
    assert.equal(posts(sim).length, 0)
  })
}

test('CLI reserves a new report before network and refuses to overwrite it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hp-harness-offline-'))
  try {
    const inventory = join(directory, 'inventory.json')
    const reportFile = join(directory, 'report.jsonl')
    await writeFile(inventory, JSON.stringify(fixture))
    const sim = simulation()
    await main(['--fixture', inventory, '--report', reportFile], environment, async (...args) => {
      assert.equal(await readFile(reportFile, 'utf8'), '')
      return sim.fetchImpl(...args)
    })
    const saved = await readFile(reportFile, 'utf8')
    const records = saved
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    assert.equal(records.at(-1).mutationAttempted, false)
    assert.deepEqual(
      records.map((r) => r.phase),
      ['preflight-complete', 'complete']
    )
    const second = simulation()
    await assert.rejects(
      main(['--fixture', inventory, '--report', reportFile], environment, second.fetchImpl),
      { code: 'EEXIST' }
    )
    assert.equal(second.calls.length, 0)
    assert.equal(await readFile(reportFile, 'utf8'), saved)
  } finally {
    await rm(directory, { recursive: true })
  }
})

test('mutating library use requires a checkpoint writer before any request', async () => {
  const sim = simulation()
  await assert.rejects(
    check(sim, {
      allowMutation: true,
      env: { ...environment, DEV_HP_ALLOW_MUTATION: 'true' },
    }),
    /checkpoint writer/
  )
  assert.equal(sim.calls.length, 0)
})

for (const failedPhase of ['preflight-complete', 'mutation-starting']) {
  test('journal failure prevents POSTs at ' + failedPhase, async () => {
    const sim = simulation()
    const saved = []
    await assert.rejects(
      check(sim, {
        allowMutation: true,
        env: { ...environment, DEV_HP_ALLOW_MUTATION: 'true' },
        checkpoint: async (record) => {
          if (record.phase === failedPhase) throw new Error('Simulated storage failure')
          saved.push(structuredClone(record))
        },
      }),
      /storage failure/
    )
    assert.equal(posts(sim).length, 0)
    if (failedPhase === 'mutation-starting') assert.equal(saved[0].before.tokens.length, 2)
  })
}

test('journal retains original snapshots if the process exits during its first POST', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hp-harness-offline-'))
  try {
    const inventory = join(directory, 'inventory.json')
    const reportFile = join(directory, 'crash-report.jsonl')
    await writeFile(inventory, JSON.stringify(fixture))
    // The child has a fake transport and no inherited credentials. Exiting in
    // the first simulated POST reproduces a hard stop without catch/finally.
    const source = `
      import { main } from ${JSON.stringify(new URL('../scripts/test-dev-hp-concurrency.mjs', import.meta.url).href)};
      const state = ${JSON.stringify(simulation().state)};
      const fake = async (url, config) => {
        if (config.method === 'POST') process.exit(42);
        const path = new URL(url).pathname;
        let value;
        if (path === '/auth/v1/user') value = { id: config.headers.Authorization === 'Bearer fake-a' ? ${JSON.stringify(id(10))} : ${JSON.stringify(id(11))} };
        else if (path.endsWith('/campaigns')) value = [state.campaign];
        else if (path.endsWith('/characters')) value = [state.character];
        else if (path.endsWith('/tokens')) value = state.tokens;
        else throw new Error('Unexpected endpoint');
        return { ok: true, status: 200, json: async () => structuredClone(value) };
      };
      await main(['--fixture', process.argv[1], '--report', process.argv[2], '--allow-mutation'],
        ${JSON.stringify({ ...environment, DEV_HP_ALLOW_MUTATION: 'true' })}, fake);
    `
    const child = spawnSync(
      process.execPath,
      ['--input-type=module', '--eval', source, inventory, reportFile],
      {
        encoding: 'utf8',
        timeout: 5000,
        env: {},
      }
    )
    assert.equal(child.error, undefined)
    assert.equal(child.status, 42, child.stderr)
    const records = (await readFile(reportFile, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    assert.deepEqual(
      records.map((r) => r.phase),
      ['preflight-complete', 'mutation-starting']
    )
    assert.equal(records[0].before.character.data_json.hp.current, 20)
    assert.ok(records[0].before.tokens.every((t) => t.hp_current === 20))
    assert.deepEqual(records[0].before.character.data_json.inventory, ['unchanged'])
    assert.equal(records[1].mutationAttempted, true)
    assert.equal(records[1].passed, false)
  } finally {
    await rm(directory, { recursive: true })
  }
})

test(
  'parallel calls target different tokens and assert full final snapshots',
  { timeout: 2000 },
  async () => {
    const sim = simulation()
    const report = await mutate(sim)
    assert.equal(report.passed, true)
    assert.equal(posts(sim).length, 2)
    assert.deepEqual(
      posts(sim).map((c) => JSON.parse(c.config.body).p_token_id),
      fixture.tokens.map((t) => t.id)
    )
    assert.equal(report.after.character.data_json.hp.current, 13)
    assert.ok(report.after.tokens.every((t) => t.hp_current === 13))
    assert.match(report.cleanup, /Manual/)
  }
)

for (const [label, options] of [
  ['stale sibling', { staleSibling: true }],
  ['lost unrelated JSON', { corruptJSON: true }],
  ['request failure after commit', { failAfterCommit: true }],
  ['unavailable final snapshot', { unreadableAfter: true }],
  ['invalid RPC response', { badResponse: true }],
]) {
  test('collects failures without retry or cleanup: ' + label, { timeout: 2000 }, async () => {
    const sim = simulation(options)
    const report = await mutate(sim)
    assert.equal(report.passed, false)
    assert.equal(posts(sim).length, 2)
    assert.match(report.cleanup, /Do not rerun/)
    if (!options.unreadableAfter) assert.ok(report.after)
    assert.equal(report.afterViews.length, 2)
    assert.doesNotMatch(
      JSON.stringify(report),
      /sensitive-remote-error|fake-a|fake-b|never-print-this/
    )
  })
}
