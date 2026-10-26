/**
 * DEV-only atomic HP concurrency smoke runner.
 * Requires disposable fixtures and an already deployed RPC. Never uses service_role.
 * Run explicitly: RUN_DEV_HP_TESTS=YES npx tsx scripts/test-atomic-hp-dev.ts
 */
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const env = process.env
  const required = ['DEV_SUPABASE_ANON_KEY', 'DEV_HP_TEST_EMAIL', 'DEV_HP_TEST_PASSWORD', 'DEV_HP_SCENE_ID', 'DEV_HP_TOKEN_ID', 'DEV_HP_FIXTURE_CAMPAIGN_ID']
  if (env.RUN_DEV_HP_TESTS !== 'YES') throw Error('Opt-in required: RUN_DEV_HP_TESTS=YES')
  for (const k of required) if (!env[k]) throw Error(`Missing ${k}`)
  const url = env.DEV_SUPABASE_URL
  assert.equal(url, 'https://yoondivyeueyrtgeldja.supabase.co', 'Refusing non-DEV database')
  if (env.VERCEL_ENV === 'production') throw Error('Production execution forbidden')
  const db = createClient(url!, env.DEV_SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: authError } = await db.auth.signInWithPassword({ email: env.DEV_HP_TEST_EMAIL!, password: env.DEV_HP_TEST_PASSWORD! })
  if (authError) throw authError
  const sceneId = env.DEV_HP_SCENE_ID!
  const tokenId = env.DEV_HP_TOKEN_ID!
  const read = async () => {
    const r = await db.from('tokens').select('hp_current,hp_max,character_id').eq('id', tokenId).eq('scene_id', sceneId).single()
    if (r.error) throw r.error
    return r.data
  }
  // Refuse to damage ordinary game tokens: require an explicitly marked fixture campaign.
  const campaignId = env.DEV_HP_FIXTURE_CAMPAIGN_ID!
  const campaign = await db.from('campaigns').select('name').eq('id', campaignId).single()
  if (campaign.error || !campaign.data.name.startsWith('[ATOMIC-HP-TEST]')) {
    throw Error('Fixture campaign must have [ATOMIC-HP-TEST] name prefix')
  }
  const scene = await db.from('scenes').select('campaign_id').eq('id', sceneId).single()
  if (scene.error || scene.data.campaign_id !== campaignId) throw Error('Scene is not in fixture campaign')
  const ownership = await db.from('tokens').select('campaign_id').eq('id', tokenId).eq('scene_id', sceneId).single()
  if (ownership.error || ownership.data.campaign_id !== campaignId) throw Error('Token is not in fixture campaign')
  const before = await read()
  assert.equal(before.hp_current, 10, 'Disposable token must start at exactly 10 HP')
  assert.ok(before.hp_max !== null && before.hp_max === 10)
  const rpc = (p_amount: number, p_mode: 'damage' | 'heal' | 'set', p_expected_hp: number | null = null) =>
    db.rpc('apply_token_hp_atomic', { p_token_id: tokenId, p_scene_id: sceneId, p_amount, p_mode, p_expected_hp })
  const results = await Promise.all([rpc(3, 'damage'), rpc(4, 'damage')])
  for (const result of results) if (result.error) throw result.error
  const after = await read()
  assert.equal(after.hp_current, 3, 'Concurrent damage lost an update')
  if (after.character_id) {
    const ch = await db.from('characters').select('data_json').eq('id', after.character_id).single()
    if (ch.error) throw Error('Test user must be allowed to read fixture character to verify sync: ' + ch.error.message)
    assert.equal((ch.data.data_json as { hp?: { current?: number } }).hp?.current, 3, 'Token/character HP mismatch')
  }
  const stale = await rpc(8, 'set', 10)
  assert.ok(stale.error, 'Stale expected-HP set unexpectedly succeeded')
  assert.equal((await read()).hp_current, 3, 'Stale set modified HP')
  console.log('PASS: concurrent damage 10→3; character sync; stale set rejected')
  console.log('Fixture remains at 3 HP; reset or remove disposable fixture manually')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exitCode = 1
})
