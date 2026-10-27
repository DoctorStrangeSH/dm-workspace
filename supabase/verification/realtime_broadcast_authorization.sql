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
-- G. campaign:<id>, summons:<id>, token-owners:<id> remain denied until sender/receiver
--    topics and payload audiences are explicitly aligned; wall realtime on the legacy
--    campaign:<id> topic will be unavailable during this staged security rollout.
-- H. Attempt client-originated Broadcast writes; they must be denied unless a
--    separate, narrowly scoped publish policy explicitly permits the feature.
