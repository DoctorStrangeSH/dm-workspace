-- Read-only verification queries for realtime broadcast authorization.
-- Run after applying the migration in DEV/staging. These queries do not alter data.
-- They verify policy shape; role-based WebSocket tests are still mandatory.

-- 1) Confirm the broad SELECT policy is gone and the scoped policy exists.
select policyname, roles, cmd, qual
from pg_policies
where schemaname = 'realtime'
  and tablename = 'messages'
  and cmd = 'SELECT'
order by policyname;

-- Expected: "Campaign members can receive scoped broadcasts" exists;
-- no SELECT policy with a universally-true predicate remains.

-- 2) Confirm private-channel enforcement is enabled in Supabase Dashboard.
-- This setting is not queryable reliably from SQL in all Supabase versions.
-- Verify Dashboard > Realtime > Settings > "Allow public access" is OFF only
-- after every client subscription has been migrated and staging tests pass.

-- 3) Inspect browser hooks for private subscriptions and exact topic agreement.
select 'Manual WebSocket test required' as check_name,
       'Use the role/topic matrix in docs/security/realtime-storage-hardening-plan.md' as next_step;

-- Required staging cases (use real test accounts and WebSocket clients):
-- A. DM of campaign A subscribes to messages:A, music:A, fog:sceneA, tokens:sceneA.
-- B. Member of campaign A can subscribe to the same member-safe topics for A.
-- C. Member A cannot subscribe to messages:B, music:B, fog:sceneB, tokens:sceneB.
-- D. Outsider and anonymous client cannot subscribe to any campaign/scene topic.
-- E. Non-DM member cannot subscribe to handouts:A while raw-row broadcasts remain.
-- F. DM A cannot subscribe to handouts:B.
-- G. campaign:<id> remains denied. walls:<campaign_id> is member-scoped; summons:<campaign_id>
--    is DM-only; token-owners:<campaign_id> is member-scoped. Confirm hooks and trigger
--    topics match exactly. The legacy campaign topic must not be restored as a fallback.
-- H. Attempt client-originated Broadcast writes; they must be denied unless a
--    separate, narrowly scoped publish policy explicitly permits the feature.

-- 4) Read-only Storage privacy audit. Run before/after the private handout migration.
select id as bucket_id, public
from storage.buckets
where id in ('handouts', 'music', 'scene-maps')
order by id;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname ilike '%handout%'
    or policyname ilike '%music%'
    or policyname ilike '%scene map%'
  )
order by policyname;

-- Expected after the handout migration: handouts.public = false, no SELECT policy
-- grants public access to bucket_id='handouts'. Music and scene-maps intentionally
-- remain unchanged by that migration and MUST be handled in a separate rollout.
-- Do not consider Storage fully hardened while music or scene-maps remain public
-- if those assets can contain campaign-private content.

-- 5) Realtime policy audit. Expected after applying the staged Realtime migration:
select policyname, roles, cmd, qual
from pg_policies
where schemaname = 'realtime'
  and tablename = 'messages'
  and cmd = 'SELECT'
order by policyname;
