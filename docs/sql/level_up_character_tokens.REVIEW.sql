-- REVIEW-ONLY SQL PROTOTYPE. NOT A DEPLOYABLE MIGRATION.
-- WARNING: p_next_data is caller-provided and needs independent, complete
-- server-side class/ASI/spell-slot validation BEFORE this can be made executable.
-- Intentionally fail-closed so a premature install cannot mutate any HP.
-- Lock protocol: character first, then tokens ordered by id.
BEGIN;
CREATE OR REPLACE FUNCTION public.level_up_character_tokens_REVIEW_ONLY(
  p_character_id uuid,
  p_campaign_id uuid,
  p_expected_data jsonb,
  p_next_data jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_character public.characters%ROWTYPE;
  v_token public.tokens%ROWTYPE;
  v_previous_current integer;
  v_previous_max integer;
  v_next_max integer;
BEGIN
  -- Safety barrier: remove ONLY after implementing all authorization,
  -- complete class/ASI/spell-slot server-side validation and concurrency tests.
  RAISE EXCEPTION 'REVIEW ONLY: atomic level-up disabled' USING ERRCODE = '0A000';

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_character_id IS NULL OR p_campaign_id IS NULL
     OR p_expected_data IS NULL OR p_next_data IS NULL THEN
    RAISE EXCEPTION 'Missing level-up input' USING ERRCODE = '22023';
  END IF;

  -- Lock character before locking any linked token.
  SELECT * INTO v_character FROM public.characters
  WHERE id = p_character_id AND campaign_id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Character not found' USING ERRCODE = 'P0002'; END IF;

  IF NOT (
    v_character.user_id = v_actor
    OR EXISTS (
      SELECT 1 FROM public.campaign_members m
      JOIN public.campaigns cp ON cp.id = m.campaign_id
      WHERE m.user_id = v_actor AND m.role = 'dm'
        AND m.campaign_id = p_campaign_id AND cp.owner_id = v_actor
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  IF v_character.data_json IS DISTINCT FROM p_expected_data THEN
    RAISE EXCEPTION 'Character changed; retry' USING ERRCODE = '40001';
  END IF;

  -- Prototype: validate numeric HP and strict expected state.
  IF jsonb_typeof(p_expected_data->'hp'->'current') <> 'number'
    OR jsonb_typeof(p_expected_data->'hp'->'max') <> 'number'
    OR jsonb_typeof(p_next_data->'hp'->'current') <> 'number'
    OR jsonb_typeof(p_next_data->'hp'->'max') <> 'number'
    OR (p_expected_data->'hp'->>'current') !~ '^[0-9]+$'
    OR (p_expected_data->'hp'->>'max') !~ '^[0-9]+$'
    OR (p_next_data->'hp'->>'current') !~ '^[0-9]+$'
    OR (p_next_data->'hp'->>'max') !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Invalid HP' USING ERRCODE = '22023';
  END IF;
  IF (p_expected_data->'hp'->>'current')::numeric > 2147483647
     OR (p_expected_data->'hp'->>'max')::numeric > 2147483647
     OR (p_next_data->'hp'->>'current')::numeric > 2147483647
     OR (p_next_data->'hp'->>'max')::numeric > 2147483647 THEN
    RAISE EXCEPTION 'HP overflow' USING ERRCODE = '22023';
  END IF;
  v_previous_current := (p_expected_data->'hp'->>'current')::integer;
  v_previous_max := (p_expected_data->'hp'->>'max')::integer;
  v_next_max := (p_next_data->'hp'->>'max')::integer;
  IF v_previous_max < 1 OR v_previous_current > v_previous_max
    OR v_next_max <= v_previous_max
    OR (p_next_data->'hp'->>'current')::integer <> v_next_max THEN
    RAISE EXCEPTION 'Invalid level-up HP transition' USING ERRCODE = '22023';
  END IF;

  -- Lock all associated tokens in deterministic UUID order.
  -- Other writers MUST also lock character before token.
  FOR v_token IN
    SELECT * FROM public.tokens
    WHERE character_id = p_character_id AND campaign_id = p_campaign_id
    ORDER BY id FOR UPDATE
  LOOP
    IF v_token.hp_current IS DISTINCT FROM v_previous_current
      OR v_token.hp_max IS DISTINCT FROM v_previous_max THEN
      RAISE EXCEPTION 'Linked token HP changed; retry' USING ERRCODE = '40001';
    END IF;
  END LOOP;

  -- TODO BEFORE ENABLEMENT: verify all linked token scene/campaign relationships,
  -- reject cross-campaign references, reject concurrent token re-linking,
  -- guarantee validation of level + class + ASI + spell slots entirely in DB,
  -- test permission/RLS behavior and legacy HP writers, and audit rollback.
  UPDATE public.characters SET data_json = p_next_data
  WHERE id = p_character_id AND campaign_id = p_campaign_id;
  UPDATE public.tokens SET hp_current = v_next_max, hp_max = v_next_max
  WHERE character_id = p_character_id AND campaign_id = p_campaign_id;
END;
$function$;
-- Do not grant EXECUTE: the function intentionally raises on every invocation.
REVOKE ALL ON FUNCTION public.level_up_character_tokens_REVIEW_ONLY(uuid,uuid,jsonb,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.level_up_character_tokens_REVIEW_ONLY(uuid,uuid,jsonb,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.level_up_character_tokens_REVIEW_ONLY(uuid,uuid,jsonb,jsonb) FROM authenticated;
COMMIT;
