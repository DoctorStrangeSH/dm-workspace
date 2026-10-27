/**
 * DEV-only real concurrent RPC harness. Run using two disposable authenticated
 * test users and a disposable linked token with valid matching character HP.
 * Usage: DEV_SUPABASE_URL=... DEV_SUPABASE_ANON_KEY=... DEV_TEST_JWT_A=...
 * DEV_TEST_JWT_B=... DEV_HP_TOKEN_ID=... DEV_HP_SCENE_ID=...
 * DEV_HP_EXPECTED_START=20 npx tsx scripts/test-dev-hp-concurrency.ts
 * Never log JWTs, run on prod, or point this at real player data.
 */
const env = process.env
if (env.DEV_HP_DISPOSABLE_FIXTURE_CONFIRMED !== 'true') {
  throw new Error('Explicit disposable DEV fixture confirmation required')
}
const url = env.DEV_SUPABASE_URL
const devUrl = 'https://yoondivyeueyrtgeldja.supabase.co'
if (url !== devUrl) throw new Error('Refusing non-DEV Supabase URL')
const anonKey = env.DEV_SUPABASE_ANON_KEY
const tokens = [env.DEV_TEST_JWT_A, env.DEV_TEST_JWT_B]
const tokenId = env.DEV_HP_TOKEN_ID
const sceneId = env.DEV_HP_SCENE_ID
const start = Number(env.DEV_HP_EXPECTED_START)
if (!anonKey || tokens.some((t) => !t) || !tokenId || !sceneId
  || !Number.isSafeInteger(start) || start < 7) {
  throw new Error('Disposable DEV credentials, IDs and valid starting HP required')
}
if (tokens[0] === tokens[1]) throw new Error('Two distinct DEV user sessions required')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!UUID.test(tokenId) || !UUID.test(sceneId)) throw new Error('Invalid test UUID')
const readHP = async (jwt: string) => {
  const headers = { apikey: anonKey!, Authorization: 'Bearer ' + jwt }
  const tokenResult = await fetch(
    devUrl + '/rest/v1/tokens?id=eq.' + tokenId + '&select=hp_current,hp_max,character_id,campaign_id',
    { headers, signal: AbortSignal.timeout(15000) },
  )
  if (!tokenResult.ok) throw new Error('Cannot inspect disposable token HP')
  const tokenRows = await tokenResult.json() as Array<{
    hp_current: number | null; hp_max: number | null; character_id: string | null; campaign_id: string
  }>
  if (tokenRows.length !== 1 || !tokenRows[0].character_id) {
    throw new Error('Fixture must contain exactly one visible character-linked token')
  }
  const charResult = await fetch(
    devUrl + '/rest/v1/characters?id=eq.' + tokenRows[0].character_id + '&select=data_json',
    { headers, signal: AbortSignal.timeout(15000) },
  )
  if (!charResult.ok) throw new Error('Cannot inspect disposable character HP')
  const chars = await charResult.json() as Array<{ data_json: { hp?: { current?: number; max?: number } } }>
  if (chars.length !== 1 || !chars[0].data_json.hp) throw new Error('Character not visible to test identity')
  return { token: tokenRows[0], charHP: chars[0].data_json.hp }
}
const before = await readHP(tokens[0]!)
const secondUserBefore = await readHP(tokens[1]!)
if (before.token.hp_current !== start || before.charHP.current !== start ||
  before.token.hp_max !== before.charHP.max) {
  throw new Error('Disposable fixture HP must match expected starting snapshot')
}
if (secondUserBefore.token.character_id !== before.token.character_id
  || secondUserBefore.token.campaign_id !== before.token.campaign_id
  || secondUserBefore.token.hp_current !== before.token.hp_current
  || secondUserBefore.token.hp_max !== before.token.hp_max
  || secondUserBefore.charHP.current !== before.charHP.current
  || secondUserBefore.charHP.max !== before.charHP.max) {
  throw new Error('DEV test sessions must see the same token and character HP snapshot')
}
if (env.DEV_HP_ALLOW_MUTATION !== 'true') {
  console.log(JSON.stringify({
    result: 'dry-run: two sessions can read consistent fixture HP',
    current: before.token.hp_current,
    max: before.token.hp_max,
    mutationPerformed: false,
  }))
  process.exit(0)
}
const invoke = async (jwt: string, amount: number) => {
  const started = Date.now()
  const response = await fetch(devUrl + '/rest/v1/rpc/apply_token_hp_atomic', {
    method: 'POST',
    headers: { apikey: anonKey!, Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_token_id: tokenId, p_scene_id: sceneId,
      p_amount: amount, p_mode: 'damage', p_expected_hp: null,
    }),
    signal: AbortSignal.timeout(15000),
  })
  const body: unknown = await response.json()
  return { amount, httpStatus: response.status, durationMs: Date.now() - started, body }
}
const [a, b] = await Promise.allSettled([
  invoke(tokens[0]!, 3),
  invoke(tokens[1]!, 4),
])
const outcomes = [a, b].map((item) => item.status === 'fulfilled'
  ? item.value
  : { error: String(item.reason) })
console.log(JSON.stringify({ test: 'two independent authenticated DEV damage calls', outcomes }, null, 2))
if (a.status !== 'fulfilled' || b.status !== 'fulfilled'
  || a.value.httpStatus !== 200 || b.value.httpStatus !== 200) {
  throw new Error('Concurrent RPC request failed; inspect outcomes before retrying')
}
const values = [a.value.body, b.value.body]
if (!values.every((v) => typeof v === 'number') || !values.includes(start - 7)) {
  throw new Error('Unexpected concurrent HP responses; check DEV HP snapshot')
}
const after = await readHP(tokens[0]!)
if (after.token.hp_current !== start - 7 || after.charHP.current !== start - 7 ||
  after.token.hp_max !== after.charHP.max) {
  throw new Error('Final token/character HP disagree or expected damage lost')
}
console.log(JSON.stringify({ result: 'verified one linked token and character', beforeHP: start, afterHP: after.token.hp_current }))
console.log('Check any additional sibling tokens separately; installed DEV RPC may leave them stale.')

export {}
