-- Read-only readiness checks for PR #37.
-- Safe to run against DEV or PROD: this file contains SELECT statements only.
-- These checks describe current state; they do not prove per-user authorization.
select
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as is_public
from storage.buckets b
where b.id in ('handouts', 'music', 'scene-maps')
order by b.id;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where (schemaname = 'storage' and tablename = 'objects'
       and policyname in (
         'Anyone can view handouts',
         'Anyone can view music',
         'Anyone can view scene maps',
         'Campaign members can read visible handouts',
         'Campaign members can read music',
         'Campaign members can read scene maps'
       ))
   or (schemaname = 'realtime' and tablename = 'messages')
order by schemaname, tablename, policyname;

select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'broadcast_fog_changes',
    'broadcast_handout_changes',
    'broadcast_message_changes',
    'broadcast_music_state',
    'broadcast_token_changes',
    'broadcast_scene_walls',
    'broadcast_summon_requests',
    'broadcast_token_owners'
  )
order by p.proname;

-- A read-only snapshot is not a substitute for tests using real authenticated
-- sessions (DM, same-campaign player, other-campaign user, outsider, anonymous).
-- Never run PR #37 migrations on PROD for this checklist.
