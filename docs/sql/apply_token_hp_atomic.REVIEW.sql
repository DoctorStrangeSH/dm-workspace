-- REVIEW DRAFT ONLY. Not in supabase/migrations; must NOT be applied to production.
-- Verify actual schema, RLS and migration ownership in isolated DEV before promotion.
-- This function intentionally fails closed if token & linked character HP disagree.
-- Linked token lock order: character -> token. Deploy only alongside coordinated HP writers.
BEGIN;
CREATE OR REPLACE FUNCTION public.apply_token_hp_atomic(
  p_token_id uuid,
  p_scene_id uuid,
  p_amount integer,
  p_mode text,
  p_expected_hp integer DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_token public.tokens%ROWTYPE;
  v_preflight_token public.tokens%ROWTYPE;
  v_char public.characters%ROWTYPE;
  v_new integer;
  v_char_hp jsonb;
  v_hp_max integer;
  v_current integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_token_id IS NULL OR p_scene_id IS NULL OR p_amount IS NULL
     OR p_amount < 0 OR p_amount > 1000000
     OR p_mode IS NULL OR p_mode NOT IN ('damage', 'heal', 'set') THEN
    RAISE EXCEPTION 'Invalid HP request' USING ERRCODE = '22023';
  END IF;

  -- Preflight is ONLY a lookup; do not trust it for authorization or HP values.
  SELECT t.* INTO v_preflight_token
  FROM public.tokens t
  JOIN public.scenes s ON s.id = t.scene_id AND s.campaign_id = t.campaign_id
  WHERE t.id = p_token_id AND t.scene_id = p_scene_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found' USING ERRCODE = 'P0002';
  END IF;

  -- Common order for linked token writers: character -> token.
  -- Never hold a token lock while waiting for a character lock.
  IF v_preflight_token.character_id IS NOT NULL THEN
    SELECT c.* INTO v_char FROM public.characters c
    WHERE c.id = v_preflight_token.character_id
      AND c.campaign_id = v_preflight_token.campaign_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Linked character not found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  SELECT t.* INTO v_token
  FROM public.tokens t
  JOIN public.scenes s ON s.id = t.scene_id AND s.campaign_id = t.campaign_id
  WHERE t.id = p_token_id AND t.scene_id = p_scene_id
  FOR UPDATE OF t;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found' USING ERRCODE = 'P0002';
  END IF;
  -- Reject linkage/ownership changes between the preflight read and lock.
  -- The transaction rolls back all writes and the caller may retry.
  IF v_token.character_id IS DISTINCT FROM v_preflight_token.character_id
     OR v_token.campaign_id IS DISTINCT FROM v_preflight_token.campaign_id THEN
    RAISE EXCEPTION 'Token link changed; retry' USING ERRCODE = '40001';
  END IF;

  -- Explicit permissions required under SECURITY DEFINER.
  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_members m
    WHERE m.campaign_id = v_token.campaign_id AND m.user_id = v_user
      AND (
        (m.role = 'dm' AND EXISTS (
          SELECT 1 FROM public.campaigns cp
          WHERE cp.id = v_token.campaign_id AND cp.owner_id = v_user
        ))
        OR v_token.owner_id = v_user
        OR EXISTS (
          SELECT 1 FROM public.token_owners o
          WHERE o.token_id = v_token.id
            AND o.campaign_id = v_token.campaign_id
            AND o.user_id = v_user
        )
      )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  IF v_token.hp_current IS NULL OR v_token.hp_max IS NULL
    OR v_token.hp_max <= 0 OR v_token.hp_current < 0
    OR v_token.hp_current > v_token.hp_max THEN
    RAISE EXCEPTION 'Invalid token HP' USING ERRCODE = '22023';
  END IF;
  IF p_expected_hp IS NOT NULL AND (p_expected_hp < 0 OR p_expected_hp > v_token.hp_max) THEN
    RAISE EXCEPTION 'Invalid expected HP' USING ERRCODE = '22023';
  END IF;
  IF p_mode = 'set' AND p_expected_hp IS NULL THEN
    RAISE EXCEPTION 'Setting HP requires expected current HP' USING ERRCODE = '22023';
  END IF;
  IF p_expected_hp IS NOT NULL AND v_token.hp_current <> p_expected_hp THEN
    RAISE EXCEPTION 'HP changed; retry' USING ERRCODE = '40001';
  END IF;

  IF v_token.character_id IS NOT NULL THEN
    -- v_char was locked before the token (and link revalidated above).

    v_char_hp := v_char.data_json -> 'hp';
    -- Require integral JSON numbers, not coercion of malformed strings.
    IF jsonb_typeof(v_char_hp) <> 'object'
      OR jsonb_typeof(v_char_hp -> 'current') <> 'number'
      OR jsonb_typeof(v_char_hp -> 'max') <> 'number'
      OR (v_char_hp ->> 'current') !~ '^[0-9]+$'
      OR (v_char_hp ->> 'max') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid linked character HP' USING ERRCODE = '22023';
    END IF;
    IF length(v_char_hp ->> 'current') > 10 OR length(v_char_hp ->> 'max') > 10 THEN
      RAISE EXCEPTION 'Linked character HP out of integer range' USING ERRCODE = '22023';
    END IF;
    -- Even ten digits may exceed int4; validate numeric range before casting.
    IF (v_char_hp ->> 'current')::numeric > 2147483647
      OR (v_char_hp ->> 'max')::numeric > 2147483647 THEN
      RAISE EXCEPTION 'Linked character HP out of integer range' USING ERRCODE = '22023';
    END IF;
    v_current := (v_char_hp ->> 'current')::integer;
    v_hp_max := (v_char_hp ->> 'max')::integer;
    IF v_hp_max <= 0 OR v_current < 0 OR v_current > v_hp_max
      OR v_hp_max <> v_token.hp_max OR v_current <> v_token.hp_current THEN
      RAISE EXCEPTION 'Token and character HP disagree' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_mode = 'damage' THEN
    v_new := GREATEST(0, v_token.hp_current - p_amount);
  ELSIF p_mode = 'heal' THEN
    v_new := LEAST(v_token.hp_max, v_token.hp_current::bigint + p_amount)::integer;
  ELSE
    v_new := LEAST(v_token.hp_max, p_amount);
  END IF;

  -- Locking both rows guarantees consistency only among writers that use this RPC.
  -- Fail closed on a partial update rather than falsely reporting success.
  UPDATE public.tokens SET hp_current = v_new WHERE id = v_token.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token disappeared during HP update' USING ERRCODE = 'P0002';
  END IF;
  IF v_token.character_id IS NOT NULL THEN
    UPDATE public.characters
    SET data_json = jsonb_set(data_json, '{hp,current}', to_jsonb(v_new), false)
    WHERE id = v_char.id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Linked character disappeared during HP update' USING ERRCODE = 'P0002';
    END IF;
  END IF;
  RETURN v_new;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_token_hp_atomic(uuid,uuid,integer,text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_token_hp_atomic(uuid,uuid,integer,text,integer) FROM anon;
REVOKE ALL ON FUNCTION public.apply_token_hp_atomic(uuid,uuid,integer,text,integer) FROM service_role;
GRANT EXECUTE ON FUNCTION public.apply_token_hp_atomic(uuid,uuid,integer,text,integer) TO authenticated;
COMMIT;
