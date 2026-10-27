/**
 * DEV-only real concurrent RPC harness. Run using two disposable authenticated
 * test users and a disposable linked token with valid matching character HP.
 * Usage: DEV_SUPABASE_URL=... DEV_SUPABASE_ANON_KEY=... DEV_TEST_JWT_A=...
 * DEV_TEST_JWT_B=... DEV_HP_TOKEN_ID=... DEV_HP_SCENE_ID=...
 * DEV_HP_EXPECTED_START=20 npx tsx scripts/test-dev-hp-concurrency.ts
 * Never log JWTs, run on prod, or point this at real player data.
 */
const env = process.env
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
console.log('RPC responses consistent with serialized damage. Independently verify ALL linked tokens and character HP.')
