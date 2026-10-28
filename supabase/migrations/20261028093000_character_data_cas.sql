-- RLS-respecting compare-and-swap for existing whole-document character writers.
create or replace function public.update_character_data_cas(p_character_id uuid,p_campaign_id uuid,p_expected jsonb,p_next jsonb)
returns boolean language plpgsql security invoker set search_path=''
as $fn$
begin
 if (select auth.uid()) is null then return false; end if;
 if p_expected is null or p_next is null or jsonb_typeof(p_expected)<>'object' or jsonb_typeof(p_next)<>'object' or length(p_next::text)>200000 then
  raise exception 'Invalid character data' using errcode='22023';
 end if;
 update public.characters set data_json=p_next where id=p_character_id and campaign_id=p_campaign_id and data_json=p_expected;
 return found;
end;
$fn$;
revoke all on function public.update_character_data_cas(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.update_character_data_cas(uuid,uuid,jsonb,jsonb) to authenticated;
