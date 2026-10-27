-- REVIEW-ONLY: do not deploy until RLS, campaign membership and grants are checked in DEV.
-- SECURITY DEFINER bypasses token RLS solely to answer a boolean.
-- Never return token IDs or HP values; no data mutation.
BEGIN;
CREATE OR REPLACE FUNCTION public.has_linked_character_tokens(
  p_character_id uuid,
  p_campaign_id uuid
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR p_character_id IS NULL OR p_campaign_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required or invalid request' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.characters c
    JOIN public.campaign_members m ON m.campaign_id = c.campaign_id
    WHERE c.id = p_character_id AND c.campaign_id = p_campaign_id
      AND m.user_id = v_user
      AND (
        c.user_id = v_user
        OR (
          m.role = 'dm'
          AND EXISTS (
            SELECT 1 FROM public.campaigns cp
            WHERE cp.id = p_campaign_id AND cp.owner_id = v_user
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.tokens t
    WHERE t.campaign_id = p_campaign_id AND t.character_id = p_character_id
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.has_linked_character_tokens(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_linked_character_tokens(uuid,uuid) FROM anon;
REVOKE ALL ON FUNCTION public.has_linked_character_tokens(uuid,uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.has_linked_character_tokens(uuid,uuid) TO authenticated;
COMMIT;
