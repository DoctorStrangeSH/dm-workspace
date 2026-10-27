/**
 * DEV-only real concurrent RPC harness. Run using two disposable authenticated
 * test users and a disposable linked token with valid matching character HP.
 * Usage: DEV_SUPABASE_URL=... DEV_SUPABASE_ANON_KEY=... DEV_TEST_EMAIL_A=... DEV_TEST_PASSWORD_A=...
 * DEV_TEST_EMAIL_B=... DEV_TEST_PASSWORD_B=... DEV_HP_TOKEN_ID=... DEV_HP_SCENE_ID=...
 * DEV_HP_EXPECTED_START=20 npx tsx scripts/test-dev-hp-concurrency.ts
 * Never log JWTs, run on prod, or point this at real player data.
 */
async function main() {
const env = process.env
if (env.DEV_HP_DISPOSABLE_FIXTURE_CONFIRMED !== 'true') {
  throw new Error('Explicit disposable DEV fixture confirmation required')
}
const url = env.DEV_SUPABASE_URL
const devUrl = 'https://yoondivyeueyrtgeldja.supabase.co'
if (url !== devUrl) throw new Error('Refusing non-DEV Supabase URL')
const anonKey = env.DEV_SUPABASE_ANON_KEY
const signIn = async (email: string | undefined, password: string | undefined): Promise<string> => {
  if (!email || !password) throw new Error('DEV test email/password variables required')
  const response = await fetch(devUrl + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: anonKey!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('DEV test account sign-in failed')
  const result = await response.json() as { access_token?: string }
  if (!result.access_token) throw new Error('DEV test session missing')
  return result.access_token
}
const tokens = await Promise.all([
  signIn(env.DEV_TEST_EMAIL_A, env.DEV_TEST_PASSWORD_A),
  signIn(env.DEV_TEST_EMAIL_B, env.DEV_TEST_PASSWORD_B),
])
const tokenId = env.DEV_HP_TOKEN_ID
const sceneId = env.DEV_HP_SCENE_ID
const start = Number(env.DEV_HP_EXPECTED_START)
if (!anonKey || tokens.some((t) => !t) || !tokenId || !sceneId
  || !Number.isSafeInteger(start) || start < 7) {
  throw new Error('Disposable DEV credentials, IDs and valid starting HP required')
}
if (tokens[0] === tokens[1]) throw new Error('Two distinct DEV user sessions required')
// Distinct JWT strings may refer to the same user; verify both identities remotely.
const getUserId = async (jwt: string): Promise<string> => {
  const response = await fetch(devUrl + '/auth/v1/user', {
    headers: { apikey: anonKey!, Authorization: 'Bearer ' + jwt },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('DEV test user authentication failed')
  const user = await response.json() as { id?: string }
  if (!user.id) throw new Error('DEV test user missing identity')
  return user.id
}
const userIds = await Promise.all(tokens.map((jwt) => getUserId(jwt!)))
if (userIds[0] === userIds[1]) throw new Error('Two different authenticated DEV users are required')
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
// A confirmation flag alone cannot distinguish disposable records from player data.
const testPrefix = 'HP-DEV-TEST-'
const readRows = async <T>(table: string, select: string, filter: string): Promise<T[]> => {
  const response = await fetch(devUrl + '/rest/v1/' + table + '?' + filter + '&select=' + select, {
    headers: { apikey: anonKey!, Authorization: 'Bearer ' + tokens[0]! },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Cannot verify disposable ' + table + ' record')
  return await response.json() as T[]
}
const fixtureToken = await readHP(tokens[0]!)
const campaigns = await readRows<{ name: string }>(
  'campaigns', 'name', 'id=eq.' + fixtureToken.token.campaign_id,
)
const characters = await readRows<{ name: string }>(
  'characters', 'name', 'id=eq.' + fixtureToken.token.character_id,
)
const siblingTokens = await readRows<{ id: string }>(
  'tokens', 'id', 'character_id=eq.' + fixtureToken.token.character_id,
)
if (campaigns.length !== 1 || characters.length !== 1
  || !campaigns[0].name.startsWith(testPrefix)
  || !characters[0].name.startsWith(testPrefix)) {
  throw new Error('Campaign and character must both use disposable HP-DEV-TEST- prefix')
}
if (siblingTokens.length !== 1 || siblingTokens[0].id !== tokenId) {
  throw new Error('Installed DEV RPC test requires exactly one visible linked token')
}
const secondToken = await readHP(tokens[1]!)
if (secondToken.token.character_id !== fixtureToken.token.character_id
  || secondToken.token.campaign_id !== fixtureToken.token.campaign_id) {
  throw new Error('Second DEV test user cannot verify the same disposable fixture')
}
const before = await readHP(tokens[0]!)
if (before.token.hp_current !== start || before.charHP.current !== start ||
  before.token.hp_max !== before.charHP.max) {
  throw new Error('Disposable fixture HP must match expected starting snapshot')
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

}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'DEV HP harness failed')
  process.exitCode = 1
})

export {}
