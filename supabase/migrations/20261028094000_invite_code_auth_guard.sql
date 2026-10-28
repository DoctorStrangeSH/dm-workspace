-- Focused port of tested invite-code authorization from legacy PR #31.
-- The campaign membership policy requires a DM for direct INSERT.
-- Joining as a player remains possible only through authenticated RPC.
drop policy if exists "DM can add members" on public.campaign_members;
create policy "DM can add members" on public.campaign_members
for insert to public with check (public.is_campaign_dm(campaign_id));

create or replace function public.join_campaign_by_code(code text)
returns uuid language plpgsql security definer
set search_path = public, pg_temp
as $fn$
declare v_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if code is null or length(trim(code)) = 0 or length(code) > 256 then
    raise exception 'Invalid invite code' using errcode = '22023';
  end if;
  select c.id into v_campaign_id from public.campaigns c where c.invite_code = code;
  if v_campaign_id is null then
    raise exception 'Invalid invite code' using errcode = '22023';
  end if;
  insert into public.campaign_members(campaign_id,user_id,role)
  values(v_campaign_id,auth.uid(),'player')
  on conflict(campaign_id,user_id) do nothing;
  return v_campaign_id;
end;
$fn$;
revoke all on function public.join_campaign_by_code(text) from public,anon;
grant execute on function public.join_campaign_by_code(text) to authenticated;
