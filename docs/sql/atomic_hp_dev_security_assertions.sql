-- Read-only DEV readiness checks. No gameplay rows and no mutations.
-- Execute on dm-workspace DEV only. Inspect results before allowing RPC deployment.
WITH required AS (
  SELECT 'tokens'::text AS table_name, 'hp_current'::text AS column_name UNION ALL
  SELECT 'tokens','hp_max' UNION ALL
  SELECT 'tokens','campaign_id' UNION ALL
  SELECT 'tokens','character_id' UNION ALL
  SELECT 'characters','data_json' UNION ALL
  SELECT 'campaign_members','role' UNION ALL
  SELECT 'token_owners','campaign_id'
)
SELECT r.table_name, r.column_name,
       (c.column_name IS NOT NULL) AS present
FROM required r LEFT JOIN information_schema.columns c
ON c.table_schema='public' AND c.table_name=r.table_name AND c.column_name=r.column_name
ORDER BY r.table_name, r.column_name;

SELECT p.proname, p.prosecdef AS security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
 AND p.proname IN ('apply_token_hp_atomic','is_campaign_dm','user_campaign_ids','user_dm_campaign_ids')
ORDER BY p.proname;

SELECT c.relname, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
AND c.relname IN ('tokens','characters','token_owners','campaign_members');
