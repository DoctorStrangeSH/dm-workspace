-- Atomic class/subclass patch. Tested against DEV project yoondivyeueyrtgeldja.
-- IMPORTANT: this does not protect against legacy clients that replace the entire data_json.
create or replace function public.update_character_identity_atomic(
  p_character_id uuid,
  p_campaign_id uuid,
  p_class text,
  p_subclass text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  v_class text;
  v_expected text;
begin
  if (select auth.uid()) is null then return false; end if;
  v_class := regexp_replace(p_class, '^srd-2024_', '');
  if v_class is null or v_class not in (
    'barbarian','bard','cleric','druid','fighter','monk',
    'paladin','ranger','rogue','sorcerer','warlock','wizard'
  ) then
    raise exception 'Invalid base class' using errcode = '22023';
  end if;
  if p_subclass is not null then
    v_expected := case p_subclass
      when 'srd-2024_path-of-the-berserker' then 'barbarian'
      when 'srd-2024_college-of-lore' then 'bard'
      when 'srd-2024_life-domain' then 'cleric'
      when 'srd-2024_circle-of-the-land' then 'druid'
      when 'srd-2024_champion' then 'fighter'
      when 'srd-2024_warrior-of-the-open-hand' then 'monk'
      when 'srd-2024_oath-of-devotion' then 'paladin'
      when 'srd-2024_hunter' then 'ranger'
      when 'srd-2024_thief' then 'rogue'
      when 'srd-2024_draconic-sorcery' then 'sorcerer'
      when 'srd-2024_fiend-patron' then 'warlock'
      when 'srd-2024_evoker' then 'wizard'
      else null
    end;
    if v_expected is distinct from v_class then
      raise exception 'Subclass does not match base class' using errcode = '22023';
    end if;
  end if;

  update public.characters
  set data_json = case when p_subclass is null
    then jsonb_set(coalesce(data_json, '{}'::jsonb) - 'subclass', '{class}', to_jsonb(v_class), true)
    else jsonb_set(
      jsonb_set(coalesce(data_json, '{}'::jsonb), '{class}', to_jsonb(v_class), true),
      '{subclass}', to_jsonb(p_subclass), true
    )
    end
  where id = p_character_id and campaign_id = p_campaign_id;
  return found;
end;
$fn$;

revoke all on function public.update_character_identity_atomic(uuid,uuid,text,text) from public, anon;
grant execute on function public.update_character_identity_atomic(uuid,uuid,text,text) to authenticated;
