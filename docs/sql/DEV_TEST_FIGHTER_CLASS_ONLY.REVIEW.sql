-- REVIEW ONLY. Execute manually in the confirmed DEV Supabase SQL Editor.
-- Never run in production. Updates only the class property of one disposable test character.
BEGIN;
DO $$
DECLARE
  v_url text;
  v_count integer;
BEGIN
  -- A SQL Editor session may not expose project URL; verify project visually first.
  IF NOT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = 'd3f8b097-f6ea-41ba-bc4b-90880c5d1c81'::uuid
      AND name LIKE '[ATOMIC-HP-TEST]%'
  ) THEN
    RAISE EXCEPTION 'Wrong project or missing disposable test campaign';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tokens
    WHERE id='3ac90049-ad67-4452-85cb-8fa6b451941d'::uuid
      AND character_id='39a05cc6-40ed-48a2-954d-2d00bd450ec8'::uuid
      AND campaign_id='d3f8b097-f6ea-41ba-bc4b-90880c5d1c81'::uuid
      AND hp_current=3 AND hp_max=10
  ) THEN
    RAISE EXCEPTION 'Unexpected token link or HP; no changes made';
  END IF;

  UPDATE public.characters
  SET data_json = jsonb_set(data_json, '{class}', to_jsonb('fighter'::text), false)
  WHERE id='39a05cc6-40ed-48a2-954d-2d00bd450ec8'::uuid
    AND campaign_id='d3f8b097-f6ea-41ba-bc4b-90880c5d1c81'::uuid
    AND name='Тестовый воин'
    AND data_json->>'class'='srd-2024_circle-of-the-land'
    AND data_json->'hp'='{"current":3,"max":10,"temp":0}'::jsonb;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one matching character, got %', v_count;
  END IF;
END $$;
COMMIT;

-- Confirm after execution:
SELECT c.name,c.data_json->>'class' AS class,c.data_json->'hp' AS character_hp,
       t.hp_current AS token_hp,t.hp_max AS token_max
FROM public.characters c JOIN public.tokens t ON t.character_id=c.id
WHERE c.id='39a05cc6-40ed-48a2-954d-2d00bd450ec8'::uuid
  AND t.id='3ac90049-ad67-4452-85cb-8fa6b451941d'::uuid;
