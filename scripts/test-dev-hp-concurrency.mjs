import { isDeepStrictEqual } from 'node:util'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const DEV_URL = 'https://yoondivyeueyrtgeldja.supabase.co'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const PREFIX = 'HP-DEV-TEST-'
const fail = (message) => {
  throw new Error(message)
}
const integer = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647

function validate(env, fixture, allowMutation) {
  if (env.DEV_SUPABASE_URL !== DEV_URL) fail('Only the pinned DEV host is allowed')
  if (!env.DEV_SUPABASE_ANON_KEY || !env.DEV_TEST_JWT_A || !env.DEV_TEST_JWT_B) {
    fail('DEV anon key and two existing authenticated sessions are required')
  }
  if (
    !fixture ||
    !UUID.test(fixture.campaignId) ||
    !UUID.test(fixture.characterId) ||
    !Array.isArray(fixture.tokens) ||
    fixture.tokens.length < 2 ||
    fixture.tokens.some((t) => !UUID.test(t.id) || !UUID.test(t.sceneId)) ||
    new Set(fixture.tokens.map((t) => t.id)).size !== fixture.tokens.length ||
    !integer(fixture.startHP) ||
    !integer(fixture.maxHP) ||
    fixture.startHP < 7 ||
    fixture.startHP > fixture.maxHP ||
    typeof fixture.inventoryEvidence !== 'string' ||
    !fixture.inventoryEvidence.trim()
  ) {
    fail(
      'An independently inventoried disposable fixture with at least two unique tokens is required'
    )
  }
  if (allowMutation && env.DEV_HP_ALLOW_MUTATION !== 'true') {
    fail('Mutation requires both --allow-mutation and DEV_HP_ALLOW_MUTATION=true')
  }
}

/** No sign-in, refresh, retry, cleanup, or service-role requests. Importing does no work. */
export async function runHPCheck({
  env,
  fixture,
  allowMutation = false,
  fetchImpl = fetch,
  checkpoint,
}) {
  validate(env, fixture, allowMutation)
  if (allowMutation && typeof checkpoint !== 'function') {
    fail('Mutation requires a durable checkpoint writer')
  }
  const sessions = [env.DEV_TEST_JWT_A, env.DEV_TEST_JWT_B]
  const request = async (session, path, body) => {
    let response
    try {
      response = await fetchImpl(DEV_URL + path, {
        method: body === undefined ? 'GET' : 'POST',
        redirect: 'error',
        headers: {
          apikey: env.DEV_SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + session,
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      fail('DEV request failed or timed out; outcome may be unknown; do not retry automatically')
    }
    // Never include remote bodies, exceptions, credentials or auth IDs in errors.
    if (!response.ok) fail('DEV request rejected (HTTP ' + response.status + ')')
    try {
      return await response.json()
    } catch {
      fail('Invalid DEV JSON response')
    }
  }
  const identities = await Promise.all(sessions.map((s) => request(s, '/auth/v1/user')))
  if (identities.some((u) => !UUID.test(u?.id)) || identities[0].id === identities[1].id) {
    fail('Two distinct authenticated user IDs are required')
  }

  const rows = async (session, table, query) => {
    const result = await request(session, '/rest/v1/' + table + '?' + new URLSearchParams(query))
    if (!Array.isArray(result)) fail('Expected a visible DEV row set')
    return result
  }
  const snapshot = async (session, strict = true) => {
    const [campaigns, characters, tokens] = await Promise.all([
      rows(session, 'campaigns', { id: 'eq.' + fixture.campaignId, select: 'id,name' }),
      rows(session, 'characters', {
        id: 'eq.' + fixture.characterId,
        select: 'id,campaign_id,name,data_json',
      }),
      // Do not filter by campaign: a foreign-campaign sibling must fail validation.
      rows(session, 'tokens', {
        character_id: 'eq.' + fixture.characterId,
        select: 'id,scene_id,campaign_id,character_id,hp_current,hp_max',
        order: 'id.asc',
      }),
    ])
    const campaign = campaigns[0]
    const character = characters[0]
    tokens.sort((a, b) => a.id.localeCompare(b.id))
    // Preserve final observations even when HP has drifted or links changed.
    if (!strict) return { campaign, character, tokens }
    if (
      campaigns.length !== 1 ||
      characters.length !== 1 ||
      campaign.id !== fixture.campaignId ||
      character.id !== fixture.characterId ||
      character.campaign_id !== fixture.campaignId ||
      !campaign.name?.startsWith(PREFIX) ||
      !character.name?.startsWith(PREFIX)
    ) {
      fail('Both users must see the named disposable campaign and character')
    }
    const expected = [...fixture.tokens].sort((a, b) => a.id.localeCompare(b.id))
    if (
      tokens.length !== expected.length ||
      tokens.some(
        (t, i) =>
          t.id !== expected[i].id ||
          t.scene_id !== expected[i].sceneId ||
          t.campaign_id !== fixture.campaignId ||
          t.character_id !== fixture.characterId
      )
    ) {
      fail('Visible linked-token set differs from the independent fixture inventory')
    }
    const hp = character.data_json?.hp
    if (
      !integer(hp?.current) ||
      !integer(hp?.max) ||
      hp.current > hp.max ||
      tokens.some(
        (t) =>
          !integer(t.hp_current) ||
          !integer(t.hp_max) ||
          t.hp_current !== hp.current ||
          t.hp_max !== hp.max
      )
    ) {
      fail('Character and every linked token must have valid matching HP')
    }
    return { campaign, character, tokens }
  }
  const bothSnapshots = async (report) => {
    const observations = await Promise.allSettled(sessions.map((s) => snapshot(s, !report)))
    if (report)
      report.afterViews = observations.map((o) =>
        o.status === 'fulfilled'
          ? { status: 'fulfilled', snapshot: o.value }
          : { status: 'rejected', error: 'Final snapshot could not be read' }
      )
    if (observations.some((o) => o.status !== 'fulfilled'))
      fail('Could not read both fixture views')
    const [a, b] = observations.map((o) => o.value)
    if (!isDeepStrictEqual(a, b)) fail('The two sessions see different fixture snapshots')
    return a
  }
  const before = await bothSnapshots()
  if (
    before.character.data_json.hp.current !== fixture.startHP ||
    before.character.data_json.hp.max !== fixture.maxHP
  )
    fail('Starting HP differs from fixture inventory')
  const report = {
    mode: allowMutation ? 'mutation' : 'dry-run',
    inventoryEvidence: fixture.inventoryEvidence,
    visibilityCaveat:
      'Matching RLS views do not prove completeness; independently verify the inventory before use.',
    mutationAttempted: false,
    passed: false,
    before,
  }
  // A durable preflight snapshot must exist before an RPC can begin.
  await checkpoint?.({ ...report, phase: 'preflight-complete' })
  if (!allowMutation)
    return { ...report, passed: true, result: 'Read-only preflight passed; RPC was not called' }

  report.mutationAttempted = true
  // Persist intent first: a crash after this marker means the outcome is
  // unknown even if no response was received. Failure here prevents POSTs.
  await checkpoint({ ...report, phase: 'mutation-starting' })
  // A timeout can happen after commit. Always collect both outcomes and attempt
  // final snapshots, even when one call fails. Never retry or auto-restore.
  const outcomes = await Promise.allSettled(
    [3, 4].map(async (amount, index) => {
      const target = fixture.tokens[index]
      const startedAt = new Date().toISOString()
      const hp = await request(sessions[index], '/rest/v1/rpc/apply_token_hp_atomic', {
        p_token_id: target.id,
        p_scene_id: target.sceneId,
        p_amount: amount,
        p_mode: 'damage',
        p_expected_hp: null,
      })
      if (!integer(hp)) fail('RPC returned an invalid HP value')
      return { amount, startedAt, finishedAt: new Date().toISOString(), hp }
    })
  )
  report.outcomes = outcomes.map((outcome) =>
    outcome.status === 'fulfilled'
      ? { status: 'fulfilled', ...outcome.value }
      : { status: 'rejected', error: 'RPC failed; commit outcome may be unknown' }
  )
  report.cleanup =
    'Manual inspection and restoration/removal of ALL disposable fixture rows required. Do not rerun automatically.'
  try {
    report.after = await bothSnapshots(report)
  } catch {
    return {
      ...report,
      result: 'FAIL: final snapshot unavailable or inconsistent; manually inspect all fixture rows',
    }
  }
  const finalHP = fixture.startHP - 7
  const values = outcomes.filter((o) => o.status === 'fulfilled').map((o) => o.value.hp)
  const validResponses =
    values.length === 2 &&
    values.every(integer) &&
    (isDeepStrictEqual(
      [...values].sort((a, b) => a - b),
      [finalHP, fixture.startHP - 3]
    ) ||
      isDeepStrictEqual(
        [...values].sort((a, b) => a - b),
        [finalHP, fixture.startHP - 4]
      ))
  const expectedAfter = structuredClone(before)
  expectedAfter.character.data_json.hp.current = finalHP
  for (const token of expectedAfter.tokens) token.hp_current = finalHP
  report.passed = validResponses && isDeepStrictEqual(report.after, expectedAfter)
  report.result = report.passed
    ? 'Damage case passed; this does not establish the full HP rollout contract'
    : 'FAIL: RPC outcomes or final fixture state differ from serialized damage'
  return report
}

export async function main(args = process.argv.slice(2), env = process.env, fetchImpl = fetch) {
  // Reports may contain full disposable character JSON. Never overwrite a report.
  const usage =
    'Usage: node scripts/test-dev-hp-concurrency.mjs --fixture <inventory.json> --report <new-report.jsonl> [--allow-mutation]'
  const mutation = args.at(-1) === '--allow-mutation'
  if (
    (args.length !== 4 && !(args.length === 5 && mutation)) ||
    args[0] !== '--fixture' ||
    args[2] !== '--report'
  )
    fail(usage)
  const fixture = JSON.parse(await readFile(args[1], 'utf8'))
  // Reserve the output BEFORE any network request; an existing/unwritable
  // report path must never lead to an unrecorded mutation.
  const { open } = await import('node:fs/promises')
  const output = await open(args[3], 'wx', 0o600)
  // Append-only JSONL preserves earlier checkpoints if the process terminates
  // or a later write fails. sync() must succeed before mutation is permitted.
  const checkpoint = async (record) => {
    await output.writeFile(JSON.stringify(record) + '\n')
    await output.sync()
  }
  try {
    const report = await runHPCheck({
      env,
      fixture,
      allowMutation: mutation,
      fetchImpl,
      checkpoint,
    })
    await checkpoint({ ...report, phase: 'complete' })
    console.log(report.result)
    if (report.cleanup) console.log(report.cleanup)
    if (!report.passed) process.exitCode = 1
  } catch {
    await checkpoint({
      phase: 'interrupted',
      passed: false,
      result:
        'Preflight, request or journal write failed; mutation outcome may be unknown. Inspect the fixture before any retry.',
    })
    console.error('HP check failed; details withheld to avoid exposing credentials or private data')
    process.exitCode = 1
  } finally {
    await output.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error('HP check could not start; verify arguments and local fixture/report paths')
    process.exitCode = 1
  })
}
