-- Realtime Broadcast authorization hardening (DEV/staging first).
-- Do not apply until the client subscriptions are private and the topic/payload
-- contract in docs/security/realtime-storage-hardening-plan.md is implemented.
-- This migration intentionally DENIES player access to handouts:<campaign_id>
-- until broadcast_handout_changes stops emitting raw rows and a safe member DTO
-- is implemented. It also does not authorize the legacy campaign:<id> catch-all.

begin;

drop policy if exists "Authenticated can receive broadcasts" on realtime.messages;

create policy "Campaign members can receive scoped broadcasts"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and auth.uid() is not null
  and (
    -- Campaign-scoped topics whose current payloads are intended for members.
    (
      realtime.topic() like 'messages:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'messages:' || cm.campaign_id::text
      )
    )
    or (
      realtime.topic() like 'music:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'music:' || cm.campaign_id::text
      )
    )
    -- Scene topics must resolve to a scene in a campaign the user belongs to.
    or (
      realtime.topic() like 'fog:%'
      and exists (
        select 1
        from public.scenes s
        join public.campaign_members cm on cm.campaign_id = s.campaign_id
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'fog:' || s.id::text
      )
    )
    or (
      realtime.topic() like 'tokens:%'
      and exists (
        select 1
        from public.scenes s
        join public.campaign_members cm on cm.campaign_id = s.campaign_id
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'tokens:' || s.id::text
      )
    )
    -- Walls use the scene UUID topic family; verify the actual hook/topic before
    -- enabling this branch in rollout if the implementation differs.
    or (
      realtime.topic() like 'walls:%'
      and exists (
        select 1
        from public.scenes s
        join public.campaign_members cm on cm.campaign_id = s.campaign_id
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'walls:' || s.id::text
      )
    )
    -- Handout broadcasts contain raw rows today. Temporarily DM-only until
    -- the trigger publishes a separate player-safe DTO/topic.
    or (
      realtime.topic() like 'handouts:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and cm.role = 'dm'
          and realtime.topic() = 'handouts:' || cm.campaign_id::text
      )
    )
  )
);

commit;
