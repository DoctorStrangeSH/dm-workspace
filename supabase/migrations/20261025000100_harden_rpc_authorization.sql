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
