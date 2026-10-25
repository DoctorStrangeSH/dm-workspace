-- Harden SECURITY DEFINER RPCs against cross-campaign data disclosure.
-- Apply through the Supabase SQL migration workflow after reviewing this PR.
-- These functions intentionally keep their existing signatures and return shapes.

create or replace function public.get_campaign_stats(p_campaign_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_campaign_dm(p_campaign_id) then
    raise exception 'Not authorized to view campaign stats' using errcode = '42501';
  end if;

  with chapters_stats as (
    select
      count(*) as total,
      count(*) filter (where is_visible_to_players) as visible,
      count(*) filter (where is_visible_to_players = false) as hidden,
      count(*) filter (where length(trim(content_md)) < 50) as empty
    from public.chapters
    where campaign_id = p_campaign_id
  ),
  entities_stats as (
    select
      count(*) as total,
      count(*) filter (where is_visible_to_players) as visible,
      count(*) filter (where length(trim(coalesce(description, ''))) = 0) as no_description,
      count(*) filter (where type = 'npc') as npc,
      count(*) filter (where type = 'location') as location,
      count(*) filter (where type = 'item') as item,
      count(*) filter (where type = 'monster') as monster,
      count(*) filter (where type = 'faction') as faction,
      count(*) filter (where type = 'quest') as quest,
      count(*) filter (where type = 'note') as note
    from public.entities
    where campaign_id = p_campaign_id
  ),
  entities_without_stats as (
    select count(*) as count
    from public.entities
    where campaign_id = p_campaign_id
      and type = 'monster'
      and (data_json->>'ac' is null or data_json->>'hp_max' is null)
  ),
  relations_stats as (
    select count(*) as total
    from public.entity_relations
    where campaign_id = p_campaign_id
  ),
  tags_stats as (
    select count(*) as total
    from public.tags
    where campaign_id = p_campaign_id
  ),
  recent_chapters as (
    select 'chapter' as type, id, title as name, updated_at
    from public.chapters
    where campaign_id = p_campaign_id
    order by updated_at desc
    limit 3
  ),
  recent_entities as (
    select 'entity' as type, id, name, updated_at
    from public.entities
    where campaign_id = p_campaign_id
    order by updated_at desc
    limit 3
  ),
  recent as (
    select * from recent_chapters
    union all
    select * from recent_entities
    order by updated_at desc
    limit 5
  )
  select jsonb_build_object(
    'chapters', (select row_to_json(chapters_stats) from chapters_stats),
    'entities', (select row_to_json(entities_stats) from entities_stats),
    'entities_without_stats', (select count from entities_without_stats),
    'relations', (select total from relations_stats),
    'tags', (select total from tags_stats),
    'recent', (
      select jsonb_agg(
        jsonb_build_object('type', type, 'id', id, 'name', name, 'updated_at', updated_at)
        order by updated_at desc
      )
      from recent
    )
  )
  into v_result;

  return v_result;
end;
$function$;

create or replace function public.get_campaign_tags(p_campaign_id uuid)
returns table(tag_id uuid, tag_name text, tag_color text, entities_count bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = p_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view campaign tags' using errcode = '42501';
  end if;

  return query
  select t.id, t.name, t.color, coalesce(count(et.entity_id), 0)::bigint
  from public.tags t
  left join public.entity_tags et on et.tag_id = t.id
  where t.campaign_id = p_campaign_id
  group by t.id, t.name, t.color
  order by t.name;
end;
$function$;

create or replace function public.get_entity_relations(p_entity_id uuid)
returns table(
  relation_id uuid, direction text, relation_type text,
  source_id uuid, source_name text, source_type text,
  target_id uuid, target_name text, target_type text, metadata jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_campaign_id uuid;
  v_is_dm boolean;
begin
  select e.campaign_id into v_campaign_id
  from public.entities e
  where e.id = p_entity_id;

  if v_campaign_id is null or auth.uid() is null then
    raise exception 'Entity not found or not authorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = v_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view entity relations' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);

  if not v_is_dm and not exists (
    select 1 from public.entities e
    where e.id = p_entity_id and e.is_visible_to_players = true
  ) then
    raise exception 'Not authorized to view entity relations' using errcode = '42501';
  end if;

  return query
  select r.id, 'outgoing'::text, r.relation_type::text,
    s.id, s.name, s.type::text, t.id, t.name, t.type::text, r.metadata
  from public.entity_relations r
  join public.entities s on s.id = r.source_id
  join public.entities t on t.id = r.target_id
  where r.campaign_id = v_campaign_id
    and r.source_id = p_entity_id
    and (v_is_dm or (s.is_visible_to_players and t.is_visible_to_players))
  union all
  select r.id, 'incoming'::text, r.relation_type::text,
    s.id, s.name, s.type::text, t.id, t.name, t.type::text, r.metadata
  from public.entity_relations r
  join public.entities s on s.id = r.source_id
  join public.entities t on t.id = r.target_id
  where r.campaign_id = v_campaign_id
    and r.target_id = p_entity_id
    and (v_is_dm or (s.is_visible_to_players and t.is_visible_to_players));
end;
$function$;

create or replace function public.get_entity_tags(p_entity_id uuid)
returns table(tag_id uuid, tag_name text, tag_color text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_campaign_id uuid;
  v_is_dm boolean;
begin
  select e.campaign_id into v_campaign_id
  from public.entities e
  where e.id = p_entity_id;

  if v_campaign_id is null or auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = v_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view entity tags' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);

  if not v_is_dm and not exists (
    select 1 from public.entities e
    where e.id = p_entity_id and e.is_visible_to_players = true
  ) then
    raise exception 'Not authorized to view entity tags' using errcode = '42501';
  end if;

  return query
  select t.id, t.name, t.color, et.created_at
  from public.entity_tags et
  join public.tags t on t.id = et.tag_id and t.campaign_id = v_campaign_id
  where et.entity_id = p_entity_id
  order by t.name;
end;
$function$;

create or replace function public.find_entity_backlinks(p_entity_id uuid)
returns table(chapter_id uuid, chapter_title text, chapter_updated_at timestamptz, snippets text[])
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_entity_name text;
  v_campaign_id uuid;
  v_is_dm boolean;
begin
  select e.name, e.campaign_id into v_entity_name, v_campaign_id
  from public.entities e
  where e.id = p_entity_id;

  if v_campaign_id is null or auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = v_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view entity backlinks' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);

  if not v_is_dm and not exists (
    select 1 from public.entities e
    where e.id = p_entity_id and e.is_visible_to_players = true
  ) then
    raise exception 'Not authorized to view entity backlinks' using errcode = '42501';
  end if;

  return query
  select c.id, c.title, c.updated_at,
    array(
      select substring(c.content_md from greatest(1, position('[[' || v_entity_name || ']]' in c.content_md) - 80) for 200)
    )
  from public.chapters c
  where c.campaign_id = v_campaign_id
    and c.content_md like '%[[' || v_entity_name || ']]%'
    and (v_is_dm or c.is_visible_to_players = true)
  order by c.updated_at desc;
end;
$function$;

create or replace function public.get_chapter_entities(p_chapter_id uuid)
returns table(entity_id uuid, entity_name text, entity_type text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_campaign_id uuid;
  v_content_md text;
  v_is_dm boolean;
begin
  select c.campaign_id, c.content_md into v_campaign_id, v_content_md
  from public.chapters c
  where c.id = p_chapter_id;

  if v_campaign_id is null or auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = v_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view chapter entities' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);

  if not v_is_dm and not exists (
    select 1 from public.chapters c
    where c.id = p_chapter_id and c.is_visible_to_players = true
  ) then
    raise exception 'Not authorized to view chapter entities' using errcode = '42501';
  end if;

  return query
  select e.id, e.name, e.type::text
  from public.entities e
  where e.campaign_id = v_campaign_id
    and v_content_md like '%[[' || e.name || ']]%'
    and (v_is_dm or e.is_visible_to_players = true)
  order by e.name;
end;
$function$;

create or replace function public.join_campaign_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if code is null or length(trim(code)) = 0 or length(code) > 256 then
    raise exception 'Invalid invite code' using errcode = '22023';
  end if;

  select c.id into v_campaign_id
  from public.campaigns c
  where c.invite_code = code;

  if v_campaign_id is null then
    raise exception 'Invalid invite code' using errcode = '22023';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_campaign_id, auth.uid(), 'player')
  on conflict (campaign_id, user_id) do nothing;

  return v_campaign_id;
end;
$function$;

-- These RPCs are application features, not anonymous endpoints.
revoke all on function public.get_campaign_stats(uuid) from public, anon;
revoke all on function public.get_campaign_tags(uuid) from public, anon;
revoke all on function public.get_entity_relations(uuid) from public, anon;
revoke all on function public.get_entity_tags(uuid) from public, anon;
revoke all on function public.find_entity_backlinks(uuid) from public, anon;
revoke all on function public.get_chapter_entities(uuid) from public, anon;
revoke all on function public.join_campaign_by_code(text) from public, anon;

grant execute on function public.get_campaign_stats(uuid) to authenticated;
grant execute on function public.get_campaign_tags(uuid) to authenticated;
grant execute on function public.get_entity_relations(uuid) to authenticated;
grant execute on function public.get_entity_tags(uuid) to authenticated;
grant execute on function public.find_entity_backlinks(uuid) to authenticated;
grant execute on function public.get_chapter_entities(uuid) to authenticated;
grant execute on function public.join_campaign_by_code(text) to authenticated;
