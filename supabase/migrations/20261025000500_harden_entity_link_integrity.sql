-- Harden entity relation/tag integrity and player visibility.
-- Apply only after reviewing in DEV/staging. Existing cross-campaign data must be zero.
do $$
begin
  if exists (
    select 1 from public.entity_relations r
    join public.entities s on s.id = r.source_id
    join public.entities t on t.id = r.target_id
    where s.campaign_id is distinct from t.campaign_id
       or r.campaign_id is distinct from s.campaign_id
  ) or exists (
    select 1 from public.entity_tags et
    join public.entities e on e.id = et.entity_id
    join public.tags t on t.id = et.tag_id
    where e.campaign_id is distinct from t.campaign_id
  ) then
    raise exception 'Cross-campaign entity links exist; resolve before migration';
  end if;
end $$;

-- Deferred constraint triggers validate final transaction state, including moves
-- of linked entities/tags between campaigns.
create or replace function public.assert_entity_link_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $fn$
declare
  v_invalid boolean := false;
begin
  -- Check only links touched by this row. Re-read current state because
  -- deferred triggers may run after several changes in one transaction.
  if TG_TABLE_NAME = 'entity_relations' then
    select exists (
      select 1 from public.entity_relations r
      join public.entities s on s.id = r.source_id
      join public.entities d on d.id = r.target_id
      where r.id = NEW.id
        and (r.campaign_id is distinct from s.campaign_id
          or s.campaign_id is distinct from d.campaign_id)
    ) into v_invalid;
  elsif TG_TABLE_NAME = 'entity_tags' then
    select exists (
      select 1 from public.entity_tags et
      join public.entities e on e.id = et.entity_id
      join public.tags t on t.id = et.tag_id
      where et.entity_id = NEW.entity_id and et.tag_id = NEW.tag_id
        and e.campaign_id is distinct from t.campaign_id
    ) into v_invalid;
  elsif TG_TABLE_NAME = 'entities' then
    select exists (
      select 1 from public.entity_relations r
      join public.entities s on s.id = r.source_id
      join public.entities d on d.id = r.target_id
      where (r.source_id = NEW.id or r.target_id = NEW.id)
        and (r.campaign_id is distinct from s.campaign_id
          or s.campaign_id is distinct from d.campaign_id)
    ) or exists (
      select 1 from public.entity_tags et
      join public.tags t on t.id = et.tag_id
      join public.entities e on e.id = et.entity_id
      where et.entity_id = NEW.id
        and e.campaign_id is distinct from t.campaign_id
    ) into v_invalid;
  elsif TG_TABLE_NAME = 'tags' then
    select exists (
      select 1 from public.entity_tags et
      join public.entities e on e.id = et.entity_id
      join public.tags t on t.id = et.tag_id
      where et.tag_id = NEW.id
        and e.campaign_id is distinct from t.campaign_id
    ) into v_invalid;
  end if;
  if v_invalid then
    raise exception 'Entity relations and tags must stay within one campaign'
      using errcode = '23514';
  end if;
  return null;
end;
$fn$;

revoke all on function public.assert_entity_link_integrity() from public, anon, authenticated;

create constraint trigger entity_relations_integrity
after insert or update on public.entity_relations
deferrable initially deferred
for each row execute function public.assert_entity_link_integrity();

create constraint trigger entity_tags_integrity
after insert or update on public.entity_tags
deferrable initially deferred
for each row execute function public.assert_entity_link_integrity();

create constraint trigger entities_links_integrity
after update of campaign_id on public.entities
deferrable initially deferred
for each row execute function public.assert_entity_link_integrity();

create constraint trigger tags_links_integrity
after update of campaign_id on public.tags
deferrable initially deferred
for each row execute function public.assert_entity_link_integrity();

-- A campaign member can see a relation only when both endpoints are visible.
drop policy if exists "Members see relations" on public.entity_relations;
create policy "Members see visible relations"
on public.entity_relations for select to authenticated
using (
  campaign_id in (select public.user_campaign_ids())
  and exists (
    select 1 from public.entities src
    join public.entities dst on dst.id = entity_relations.target_id
    where src.id = entity_relations.source_id
      and src.campaign_id = entity_relations.campaign_id
      and dst.campaign_id = entity_relations.campaign_id
      and src.is_visible_to_players = true
      and dst.is_visible_to_players = true
  )
);

-- A campaign member can see tags only on entities visible to players.
drop policy if exists "Members see entity_tags" on public.entity_tags;
create policy "Members see visible entity_tags"
on public.entity_tags for select to authenticated
using (
  exists (
    select 1 from public.entities e
    where e.id = entity_tags.entity_id
      and e.is_visible_to_players = true
      and e.campaign_id in (select public.user_campaign_ids())
  )
);
