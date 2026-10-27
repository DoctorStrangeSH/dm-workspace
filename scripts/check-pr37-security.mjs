import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const realtime = read('../supabase/migrations/20261027000100_realtime_broadcast_authorization.sql')
const handouts = read('../supabase/migrations/20261027000200_private_handout_storage.sql')
const music = read('../supabase/migrations/20261027000300_private_music_storage.sql')
const maps = read('../supabase/migrations/20261027000400_private_scene_maps_storage.sql')
const handoutHook = read('../src/lib/hooks/use-realtime-handouts.ts')
const handoutRoute = read('../src/app/api/handouts/[id]/image/route.ts')
const musicRoute = read('../src/app/api/music/tracks/[id]/audio/route.ts')
const mapRoute = read('../src/app/api/scenes/[id]/map/route.ts')

const checks = []
function check(name, fn) {
  fn()
  checks.push(name)
}

function has(text, pattern, message) {
  assert.match(text, pattern, message)
}

check('Realtime migration is transactional', () => {
  has(realtime, /^begin;/im, 'Realtime migration must begin a transaction')
  has(realtime, /commit;\s*$/i, 'Realtime migration must commit')
})

check('Broad authenticated Broadcast read policy is removed', () => {
  has(realtime, /drop policy if exists "Authenticated can receive broadcasts" on realtime\.messages/i)
  has(realtime, /create policy "Campaign members can receive scoped broadcasts"/i)
  has(realtime, /realtime\.topic\(\) = 'messages:' \|\| cm\.campaign_id::text/i)
  has(realtime, /realtime\.topic\(\) = 'summons:' \|\| cm\.campaign_id::text/i)
  has(realtime, /cm\.role = 'dm'/i)
})

check('SECURITY DEFINER Broadcast functions pin search_path', () => {
  const functions = realtime.match(/create or replace function public\.[\s\S]*?\$function\$;/gi) ?? []
  assert.ok(functions.length >= 4, 'Expected replacement trigger functions')
  for (const fn of functions) {
    has(fn, /security definer/i, 'Expected SECURITY DEFINER')
    has(fn, /set search_path = pg_catalog/i, 'Each replacement function must pin search_path')
  }
  has(realtime, /alter function public\.broadcast_(fog_changes|message_changes|music_state|token_changes)\(\) set search_path = pg_catalog;/i)
  has(realtime, /realtime\.broadcast_changes\(/i, 'Broadcast calls must be schema-qualified')
})

check('Handout broadcasts publish a minimal DTO and hide/delete events', () => {
  const fn = realtime.slice(realtime.indexOf('create or replace function public.broadcast_handout_changes()'), realtime.indexOf('-- Split the legacy'))
  has(fn, /'handouts-visible:'/i)
  for (const field of ['id', 'campaign_id', 'name', 'is_visible']) {
    has(fn, new RegExp("'" + field + "'"))
  }
  has(fn, /if old\.is_visible and not new\.is_visible then/i)
  has(fn, /if old\.is_visible then/i)
  has(fn, /'DELETE'/i)
  assert.doesNotMatch(fn, /to_jsonb\(new\)|jsonb_build_object\([^)]*'image_url'/is, 'Do not broadcast raw handout rows or storage paths')
})

check('Handout client subscribes privately to the DTO topic', () => {
  has(handoutHook, /channel\(`handouts-visible:\$\{campaignId\}`, \{ config: \{ private: true \} \}\)/)
  has(handoutHook, /\.on\('broadcast', \{ event: 'DELETE' \}/)
})

check('All target Storage migrations make buckets private and drop public reads', () => {
  for (const [name, sql, bucket, publicPolicy] of [
    ['handouts', handouts, 'handouts', 'Anyone can view handouts'],
    ['music', music, 'music', 'Anyone can view music'],
    ['scene maps', maps, 'scene-maps', 'Anyone can view scene maps'],
  ]) {
    has(sql, new RegExp(`update storage\\.buckets[\\s\\S]*?set public = false[\\s\\S]*?where id = '${bucket}'`, 'i'), `${name}: bucket must be private`)
    has(sql, new RegExp(`drop policy if exists "${publicPolicy}" on storage\\.objects`, 'i'), `${name}: public read policy must be dropped`)
    has(sql, /create policy "[^"]+"\s+on storage\.objects\s+for select\s+to authenticated/i, `${name}: authenticated scoped read policy required`)
    has(sql, /create policy "Campaign DMs can delete/i, `${name}: DM delete policy must be explicit`)
    has(sql, /^begin;/im, `${name}: migration must be transactional`)
    has(sql, /commit;\s*$/i, `${name}: migration must commit`)
  }
})

check('Authorized file routes verify membership and use signed URLs', () => {
  for (const [name, route] of [['handout', handoutRoute], ['music', musicRoute], ['map', mapRoute]]) {
    has(route, /getCampaignAccess\(/, `${name}: campaign access check required`)
    has(route, /if \(!isMember/, `${name}: non-members must be denied`)
    has(route, /createSignedUrl\(/, `${name}: private object must use signed URL`)
    has(route, /Cache-Control.*private, no-store/, `${name}: signed redirect must not be publicly cached`)
    has(route, /parsed\.origin !== new URL\(configured\)\.origin/, `${name}: legacy URLs must be restricted to configured Supabase origin`)
  }
  has(handoutRoute, /!isDm && !handout\.is_visible/, 'Players must not access hidden handouts')
})


const realtimeHooks = [
  read('../src/lib/hooks/use-realtime-fog.ts'),
  read('../src/lib/hooks/use-realtime-messages.ts'),
  read('../src/lib/hooks/use-realtime-music.ts'),
  read('../src/lib/hooks/use-realtime-summons.ts'),
  read('../src/lib/hooks/use-realtime-token-owners.ts'),
  read('../src/lib/hooks/use-realtime-tokens.ts'),
  read('../src/lib/hooks/use-realtime-walls.ts'),
]

check('All migrated Realtime hooks use private channels and refresh auth before subscribe', () => {
  for (const hook of realtimeHooks) {
    has(hook, /config:\s*\{\s*private:\s*true\s*\}/, 'Every migrated Broadcast subscription must use a private channel')
    has(hook, /setAuth\(\)/, 'Every migrated Broadcast hook must set Realtime auth before subscribing')
  }
})

check('Storage read policies scope objects to the matching campaign and record', () => {
  has(handouts, /cm\.campaign_id::text = \(storage\.foldername\(name\)\)\[1\]/i, 'Handouts must be scoped to the first path segment')
  has(handouts, /h\.campaign_id = cm\.campaign_id/i, 'Handout object must belong to the member campaign')
  has(handouts, /h\.is_visible = true/i, 'Player handout reads must require visibility')
  has(music, /cm\.campaign_id::text = \(storage\.foldername\(name\)\)\[1\]/i, 'Music must be scoped to the first path segment')
  has(music, /t\.campaign_id = cm\.campaign_id/i, 'Track object must belong to the member campaign')
  has(maps, /cm\.campaign_id::text = \(storage\.foldername\(name\)\)\[1\]/i, 'Scene maps must be scoped to the first path segment')
  has(maps, /s\.campaign_id = cm\.campaign_id/i, 'Scene map must belong to a scene in the member campaign')
})

check('Realtime migration does not recreate an unrestricted read policy', () => {
  assert.doesNotMatch(realtime, /create policy[\s\S]{0,300}?on realtime\.messages[\s\S]{0,150}?using\s*\(\s*true\s*\)/i, 'Do not add a universal Broadcast read policy')
  has(realtime, /extension = 'broadcast'/i, 'Only Broadcast messages should be authorized by this policy')
  has(realtime, /auth\.uid\(\) is not null/i, 'Anonymous sessions must be denied')
  has(realtime, /realtime\.topic\(\) = 'walls:' \|\| cm\.campaign_id::text/i, 'Walls topic must be scoped to campaign membership')
  has(realtime, /realtime\.topic\(\) = 'token-owners:' \|\| cm\.campaign_id::text/i, 'Token-owner topic must be scoped to campaign membership')
  has(realtime, /realtime\.topic\(\) = 'handouts-visible:' \|\| cm\.campaign_id::text/i, 'Visible handout topic must be scoped to campaign membership')
})

console.log(`PR #37 static security checks passed: ${checks.length}`)
for (const name of checks) console.log(`  ✓ ${name}`)
console.log('Note: these are static source checks, not SQL execution or runtime authorization tests.')
