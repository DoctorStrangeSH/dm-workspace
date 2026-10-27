-- REVIEW-ONLY draft. NOT a migration. NEVER execute on Production.
-- This prototype is deliberately disabled; complete auth/RLS/concurrency review
-- and separate DEV test plan required before removing the barrier.
BEGIN;
CREATE OR REPLACE FUNCTION public.create_linked_token_atomic_REVIEW(
  p_scene_id uuid,
  p_character_id uuid,
  p_name text,
  p_x integer,
  p_y integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_campaign_id uuid;
  v_char public.characters%ROWTYPE;
  v_hp_current integer;
  v_hp_max integer;
  v_created_id uuid;
BEGIN
  RAISE EXCEPTION 'REVIEW ONLY: linked token creation disabled' USING ERRCODE = '0A000';

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_scene_id IS NULL OR p_character_id IS NULL OR p_name IS NULL
    OR length(btrim(p_name)) < 1 OR length(p_name) > 150
    OR p_x IS NULL OR p_y IS NULL THEN
    RAISE EXCEPTION 'Invalid linked token input' USING ERRCODE = '22023';
  END IF;

  SELECT s.campaign_id INTO v_campaign_id
  FROM public.scenes s WHERE s.id = p_scene_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scene not found' USING ERRCODE = 'P0002';
  END IF;

  -- Shared protocol with future level-up: character FIRST, then any tokens.
  SELECT c.* INTO v_char FROM public.characters c
  WHERE c.id = p_character_id AND c.campaign_id = v_campaign_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found in campaign' USING ERRCODE = 'P0002';
  END IF;

  -- Explicit campaign membership plus actor ownership/owner-DM permission.
  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_members m
    WHERE m.campaign_id = v_campaign_id AND m.user_id = v_actor
      AND (
        v_char.user_id = v_actor OR
        (m.role = 'dm' AND EXISTS (
          SELECT 1 FROM public.campaigns cp
          WHERE cp.id = v_campaign_id AND cp.owner_id = v_actor
        ))
      )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  -- Refuse invalid JSON numbers, overflow and numeric strings.
  IF jsonb_typeof(v_char.data_json->'hp'->'current') <> 'number'
    OR jsonb_typeof(v_char.data_json->'hp'->'max') <> 'number'
    OR (v_char.data_json->'hp'->>'current') !~ '^[0-9]+$'
    OR (v_char.data_json->'hp'->>'max') !~ '^[0-9]+$'
    OR length(v_char.data_json->'hp'->>'current') > 10
    OR length(v_char.data_json->'hp'->>'max') > 10 THEN
    RAISE EXCEPTION 'Invalid character HP' USING ERRCODE = '22023';
  END IF;
  IF (v_char.data_json->'hp'->>'current')::numeric > 2147483647
    OR (v_char.data_json->'hp'->>'max')::numeric > 2147483647 THEN
    RAISE EXCEPTION 'Character HP out of range' USING ERRCODE = '22023';
  END IF;
  v_hp_current := (v_char.data_json->'hp'->>'current')::integer;
  v_hp_max := (v_char.data_json->'hp'->>'max')::integer;
  IF v_hp_max < 1 OR v_hp_current > v_hp_max THEN
    RAISE EXCEPTION 'Invalid character HP bounds' USING ERRCODE = '22023';
  END IF;

  -- Row INSERT and character lock remain in one transaction.
  INSERT INTO public.tokens(
    scene_id, campaign_id, character_id, owner_id, name, x, y,
    hp_current, hp_max
  ) VALUES (
    p_scene_id, v_campaign_id, p_character_id, v_char.user_id, btrim(p_name),
    p_x, p_y, v_hp_current, v_hp_max
  ) RETURNING id INTO v_created_id;

  RETURN v_created_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_linked_token_atomic_REVIEW(uuid,uuid,text,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_linked_token_atomic_REVIEW(uuid,uuid,text,integer,integer) FROM anon;
REVOKE ALL ON FUNCTION public.create_linked_token_atomic_REVIEW(uuid,uuid,text,integer,integer) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_linked_token_atomic_REVIEW(uuid,uuid,text,integer,integer) FROM service_role;
COMMIT;
