-- Realtime Broadcast authorization hardening (DEV/staging first).
-- Replaces broad authenticated reads with exact campaign/scene membership checks.
-- Legacy handouts:<campaign_id> remains DM-only because it is a management stream;
-- players use handouts-visible:<campaign_id>, which emits only a safe DTO.
-- The legacy campaign:<id> catch-all is intentionally not authorized.

begin;

-- Publish only a safe DTO to players for visible handouts. Never broadcast raw
-- handout rows (which may contain hidden material metadata or storage paths).
create or replace function public.broadcast_handout_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  topic_name text;
begin
  topic_name := 'handouts-visible:' || coalesce(new.campaign_id, old.campaign_id)::text;

  if tg_op = 'INSERT' then
    if new.is_visible then
      perform realtime.send(
        jsonb_build_object('record', jsonb_build_object(
          'id', new.id,
          'campaign_id', new.campaign_id,
          'name', new.name,
          'is_visible', true
        )), 'INSERT', topic_name, true
      );
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.is_visible and not new.is_visible then
      perform realtime.send(
        jsonb_build_object('old_record', jsonb_build_object('id', old.id)),
        'DELETE', topic_name, true
      );
    elsif new.is_visible then
      perform realtime.send(
        jsonb_build_object('record', jsonb_build_object(
          'id', new.id,
          'campaign_id', new.campaign_id,
          'name', new.name,
          'is_visible', true
        )), case when old.is_visible then 'UPDATE' else 'INSERT' end,
        topic_name, true
      );
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.is_visible then
      perform realtime.send(
        jsonb_build_object('old_record', jsonb_build_object('id', old.id)),
        'DELETE', topic_name, true
      );
    end if;
    return old;
  end if;

  return coalesce(new, old);
end;
$function$;

-- Split the legacy mixed-audience campaign topic into resource-specific topics.
-- Fixed search_path and schema-qualified Broadcast function for SECURITY DEFINER.
create or replace function public.broadcast_scene_walls()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  perform realtime.broadcast_changes(
    'walls:' || coalesce(new.campaign_id, old.campaign_id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$function$;

create or replace function public.broadcast_summon_requests()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  perform realtime.broadcast_changes(
    'summons:' || coalesce(new.campaign_id, old.campaign_id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$function$;

create or replace function public.broadcast_token_owners()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  perform realtime.broadcast_changes(
    'token-owners:' || coalesce(new.campaign_id, old.campaign_id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$function$;

-- Harden every existing SECURITY DEFINER Broadcast trigger function, not only
-- the three whose topic names are split above. Existing triggers remain attached.
-- All Broadcast calls in these functions should be schema-qualified.
alter function public.broadcast_fog_changes() set search_path = pg_catalog;
alter function public.broadcast_handout_changes() set search_path = pg_catalog;
alter function public.broadcast_message_changes() set search_path = pg_catalog;
alter function public.broadcast_music_state() set search_path = pg_catalog;
alter function public.broadcast_token_changes() set search_path = pg_catalog;

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
    -- The legacy campaign:<id> topic is deliberately not authorized: it currently
    -- multiplexes walls, summons and token ownership with mixed payload audiences.
    -- Split these senders/topics before restoring wall/summon/token-owner realtime.
    or (
      realtime.topic() like 'walls:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'walls:' || cm.campaign_id::text
      )
    )
    -- Summon requests contain requester/context data; restrict the stream to DMs.
    or (
      realtime.topic() like 'summons:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and cm.role = 'dm'
          and realtime.topic() = 'summons:' || cm.campaign_id::text
      )
    )
    or (
      realtime.topic() like 'token-owners:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'token-owners:' || cm.campaign_id::text
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
    -- Player-safe visible handout DTOs only; the trigger omits hidden rows and
    -- emits DELETE when a handout is hidden or removed.
    or (
      realtime.topic() like 'handouts-visible:%'
      and exists (
        select 1
        from public.campaign_members cm
        where cm.user_id = (select auth.uid())
          and realtime.topic() = 'handouts-visible:' || cm.campaign_id::text
      )
    )
  )
);

commit;
