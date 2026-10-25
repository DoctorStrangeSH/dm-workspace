-- Harden SECURITY DEFINER RPCs against cross-campaign data disclosure.
-- Review and apply through the Supabase SQL workflow; do not run against production
-- until the PR is reviewed and the functions are tested against the live schema.

create or replace function public.count_entity_backlinks(p_campaign_id uuid)
returns table(entity_id uuid, backlinks_count bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_is_dm boolean;
begin
  if auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = p_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view backlink counts' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(p_campaign_id);

  return query
  select e.id, count(c.id)::bigint
  from public.entities e
  left join public.chapters c
    on c.campaign_id = e.campaign_id
    and c.content_md like '%[[' || e.name || ']]%'
    and (v_is_dm or c.is_visible_to_players = true)
  where e.campaign_id = p_campaign_id
    and (v_is_dm or e.is_visible_to_players = true)
  group by e.id;
end;
$function$;

create or replace function public.get_entities_tags_map(p_campaign_id uuid)
returns table(entity_id uuid, tags jsonb)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_is_dm boolean;
begin
  if auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = p_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view entity tags' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(p_campaign_id);

  return query
  select e.id,
    coalesce(
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color) order by t.name)
        filter (where t.id is not null),
      '[]'::jsonb
    )
  from public.entities e
  left join public.entity_tags et on et.entity_id = e.id
  left join public.tags t on t.id = et.tag_id and t.campaign_id = p_campaign_id
  where e.campaign_id = p_campaign_id
    and (v_is_dm or e.is_visible_to_players = true)
  group by e.id;
end;
$function$;

create or replace function public.get_location_descendants(p_root_id uuid)
returns table(relation_id uuid, entity_id uuid, entity_name text, depth integer)
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
  where e.id = p_root_id;

  if v_campaign_id is null or auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = v_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view location descendants' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);
  if not v_is_dm and not exists (
    select 1 from public.entities e
    where e.id = p_root_id and e.is_visible_to_players = true
  ) then
    raise exception 'Not authorized to view location descendants' using errcode = '42501';
  end if;

  return query
  with recursive tree as (
    select r.id as relation_id, e.id as entity_id, e.name as entity_name, 1 as depth
    from public.entity_relations r
    join public.entities e on e.id = r.target_id
    where r.source_id = p_root_id
      and r.relation_type = 'parent_of'
      and r.campaign_id = v_campaign_id
      and e.campaign_id = v_campaign_id
      and (v_is_dm or e.is_visible_to_players = true)
    union all
    select r.id, e.id, e.name, t.depth + 1
    from public.entity_relations r
    join public.entities e on e.id = r.target_id
    join tree t on t.entity_id = r.source_id
    where r.relation_type = 'parent_of'
      and r.campaign_id = v_campaign_id
      and e.campaign_id = v_campaign_id
      and t.depth < 10
      and (v_is_dm or e.is_visible_to_players = true)
  )
  select * from tree order by depth, entity_name;
end;
$function$;

create or replace function public.get_location_path(p_entity_id uuid)
returns table(entity_id uuid, entity_name text, entity_type text, entity_icon text, depth integer)
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
    raise exception 'Not authorized to view location path' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);
  if not v_is_dm and not exists (
    select 1 from public.entities e
    where e.id = p_entity_id and e.is_visible_to_players = true
  ) then
    raise exception 'Not authorized to view location path' using errcode = '42501';
  end if;

  return query
  with recursive path as (
    select e.id as entity_id, e.name as entity_name, e.type::text as entity_type,
      1 as depth, e.id as next_id
    from public.entities e
    where e.id = p_entity_id and e.campaign_id = v_campaign_id
      and (v_is_dm or e.is_visible_to_players = true)
    union all
    select e.id, e.name, e.type::text, p.depth + 1, e.id
    from public.entity_relations r
    join public.entities e on e.id = r.target_id
    join path p on p.next_id = r.source_id
    where r.relation_type in ('located_in', 'parent_of')
      and r.campaign_id = v_campaign_id
      and e.campaign_id = v_campaign_id
      and p.depth < 10
      and (v_is_dm or e.is_visible_to_players = true)
  )
  select path.entity_id, path.entity_name, path.entity_type, null::text, path.depth
  from path
  order by path.depth desc;
end;
$function$;

-- Self-inserting into campaign_members bypasses invite-code validation. Joining
-- must go through join_campaign_by_code(), which is SECURITY DEFINER below.
drop policy if exists "DM can add members" on public.campaign_members;
create policy "DM can add members"
on public.campaign_members
for insert
to public
with check (public.is_campaign_dm(campaign_id));

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

revoke all on function public.count_entity_backlinks(uuid) from public, anon;
revoke all on function public.get_entities_tags_map(uuid) from public, anon;
revoke all on function public.get_location_descendants(uuid) from public, anon;
revoke all on function public.get_location_path(uuid) from public, anon;
revoke all on function public.join_campaign_by_code(text) from public, anon;

grant execute on function public.count_entity_backlinks(uuid) to authenticated;
grant execute on function public.get_entities_tags_map(uuid) to authenticated;
grant execute on function public.get_location_descendants(uuid) to authenticated;
grant execute on function public.get_location_path(uuid) to authenticated;
grant execute on function public.join_campaign_by_code(text) to authenticated;


-- The following RPCs previously bypassed RLS without checking campaign access.
-- Keep their existing result signatures so current query callers remain compatible.

create or replace function public.find_entity_backlinks(p_entity_id uuid)
returns table(chapter_id uuid, chapter_title text, chapter_updated_at timestamp with time zone, snippets text[])
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
  with matched_chapters as (
    select c.id, c.title, c.updated_at, c.content_md
    from public.chapters c
    where c.campaign_id = v_campaign_id
      and c.content_md like '%[[' || v_entity_name || ']]%'
      and (v_is_dm or c.is_visible_to_players = true)
  )
  select
    mc.id,
    mc.title,
    mc.updated_at,
    (
      select array_agg(trim(substring(mc.content_md from greatest(1, position(']]' in substring(mc.content_md, m.match_pos + length(v_entity_name) + 4)) + m.match_pos - 80) for 200))) as snippet
      from (select position('[[' || v_entity_name || ']]' in mc.content_md) as match_pos) m
      where m.match_pos > 0 limit 1
    ) as snippets
  from matched_chapters mc
  order by mc.updated_at desc;
end;
$function$;

-- Campaign statistics include hidden content and aggregate counts. Keep this
-- administrative RPC DM-only rather than exposing hidden-content metadata.
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
    raise exception 'Not authorized to view campaign statistics' using errcode = '42501';
  end if;

  with chapters_stats as (
    select
      count(*) as total,
      count(*) filter (where is_visible_to_players) as visible,
      count(*) filter (where is_visible_to_players = false) as hidden,
      count(*) filter (where length(trim(content_md)) < 50) as empty
    from public.chapters where campaign_id = p_campaign_id
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
    from public.entities where campaign_id = p_campaign_id
  ),
  entities_without_stats as (
    select count(*) as count
    from public.entities
    where campaign_id = p_campaign_id
      and type = 'monster'
      and (data_json->>'ac' is null or data_json->>'hp_max' is null)
  ),
  relations_stats as (
    select count(*) as total from public.entity_relations where campaign_id = p_campaign_id
  ),
  tags_stats as (
    select count(*) as total from public.tags where campaign_id = p_campaign_id
  ),
  recent_chapters as (
    select 'chapter' as type, id, title as name, updated_at
    from public.chapters where campaign_id = p_campaign_id
    order by updated_at desc limit 3
  ),
  recent_entities as (
    select 'entity' as type, id, name, updated_at
    from public.entities where campaign_id = p_campaign_id
    order by updated_at desc limit 3
  ),
  recent as (
    select * from recent_chapters
    union all
    select * from recent_entities
    order by updated_at desc limit 5
  )
  select jsonb_build_object(
    'chapters', (select row_to_json(chapters_stats) from chapters_stats),
    'entities', (select row_to_json(entities_stats) from entities_stats),
    'entities_without_stats', (select count from entities_without_stats),
    'relations', (select total from relations_stats),
    'tags', (select total from tags_stats),
    'recent', coalesce(
      (select jsonb_agg(
        jsonb_build_object('type', type, 'id', id, 'name', name, 'updated_at', updated_at)
        order by updated_at desc
      ) from recent),
      '[]'::jsonb
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
declare
  v_is_dm boolean;
begin
  if auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = p_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view campaign tags' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(p_campaign_id);

  return query
  select t.id, t.name, t.color, count(distinct et.entity_id)::bigint as entities_count
  from public.tags t
  left join public.entity_tags et on et.tag_id = t.id
  left join public.entities e
    on e.id = et.entity_id
    and e.campaign_id = p_campaign_id
    and (v_is_dm or e.is_visible_to_players = true)
  where t.campaign_id = p_campaign_id
    and (v_is_dm or e.id is not null)
  group by t.id, t.name, t.color
  order by t.name;
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
  v_chapter_visible boolean;
begin
  select c.campaign_id, c.content_md, c.is_visible_to_players
  into v_campaign_id, v_content_md, v_chapter_visible
  from public.chapters c
  where c.id = p_chapter_id;

  if v_campaign_id is null or auth.uid() is null or not exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = v_campaign_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view chapter entities' using errcode = '42501';
  end if;

  v_is_dm := public.is_campaign_dm(v_campaign_id);
  if not v_is_dm and v_chapter_visible is distinct from true then
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

create or replace function public.get_entity_relations(p_entity_id uuid)
returns table(
  relation_id uuid,
  direction text,
  relation_type text,
  source_id uuid,
  source_name text,
  source_type text,
  target_id uuid,
  target_name text,
  target_type text,
  metadata jsonb
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
  from public.entities e where e.id = p_entity_id;

  if v_campaign_id is null or auth.uid() is null or not exists (
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
  join public.entities s on s.id = r.source_id and s.campaign_id = v_campaign_id
  join public.entities t on t.id = r.target_id and t.campaign_id = v_campaign_id
  where r.source_id = p_entity_id and r.campaign_id = v_campaign_id
    and (v_is_dm or (s.is_visible_to_players = true and t.is_visible_to_players = true))
  union all
  select r.id, 'incoming'::text, r.relation_type::text,
    s.id, s.name, s.type::text, t.id, t.name, t.type::text, r.metadata
  from public.entity_relations r
  join public.entities s on s.id = r.source_id and s.campaign_id = v_campaign_id
  join public.entities t on t.id = r.target_id and t.campaign_id = v_campaign_id
  where r.target_id = p_entity_id and r.campaign_id = v_campaign_id
    and (v_is_dm or (s.is_visible_to_players = true and t.is_visible_to_players = true));
end;
$function$;

create or replace function public.get_entity_tags(p_entity_id uuid)
returns table(tag_id uuid, tag_name text, tag_color text, created_at timestamp with time zone)
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
  from public.entities e where e.id = p_entity_id;

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

revoke all on function public.find_entity_backlinks(uuid) from public, anon;
revoke all on function public.get_campaign_stats(uuid) from public, anon;
revoke all on function public.get_campaign_tags(uuid) from public, anon;
revoke all on function public.get_chapter_entities(uuid) from public, anon;
revoke all on function public.get_entity_relations(uuid) from public, anon;
revoke all on function public.get_entity_tags(uuid) from public, anon;

grant execute on function public.find_entity_backlinks(uuid) to authenticated;
grant execute on function public.get_campaign_stats(uuid) to authenticated;
grant execute on function public.get_campaign_tags(uuid) to authenticated;
grant execute on function public.get_chapter_entities(uuid) to authenticated;
grant execute on function public.get_entity_relations(uuid) to authenticated;
grant execute on function public.get_entity_tags(uuid) to authenticated;
