-- READ-ONLY DEV audit. Never updates tokens or characters.
-- Run against the explicitly confirmed DEV project only.
-- Flags linked tokens that would fail the atomic RPC's HP consistency guard.
SELECT
  t.campaign_id,
  t.scene_id,
  t.id AS token_id,
  t.character_id,
  t.hp_current AS token_hp_current,
  t.hp_max AS token_hp_max,
  c.data_json -> 'hp' ->> 'current' AS character_hp_current,
  c.data_json -> 'hp' ->> 'max' AS character_hp_max,
  CASE
    WHEN c.id IS NULL THEN 'missing_character'
    WHEN c.campaign_id IS DISTINCT FROM t.campaign_id THEN 'cross_campaign_link'
    WHEN jsonb_typeof(c.data_json -> 'hp' -> 'current') IS DISTINCT FROM 'number'
      OR jsonb_typeof(c.data_json -> 'hp' -> 'max') IS DISTINCT FROM 'number'
      THEN 'invalid_character_hp'
    WHEN (c.data_json -> 'hp' ->> 'current') !~ '^[0-9]+$'
      OR (c.data_json -> 'hp' ->> 'max') !~ '^[0-9]+$'
      THEN 'invalid_character_hp'
    WHEN t.hp_current IS DISTINCT FROM (c.data_json -> 'hp' ->> 'current')::numeric
      OR t.hp_max IS DISTINCT FROM (c.data_json -> 'hp' ->> 'max')::numeric
      THEN 'hp_mismatch'
    ELSE 'in_sync'
  END AS sync_status
FROM public.tokens AS t
LEFT JOIN public.characters AS c ON c.id = t.character_id
WHERE t.character_id IS NOT NULL
ORDER BY t.campaign_id, t.scene_id, t.id;
