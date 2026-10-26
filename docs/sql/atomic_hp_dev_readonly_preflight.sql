-- DEV ONLY, READ-ONLY PRECHECKS.
-- Run against confirmed dm-workspace DEV project only. No INSERT/UPDATE/DELETE/DDL.
-- These queries inspect metadata without reading gameplay records.
SELECT current_database() AS database_name, current_user AS database_role;
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tokens','characters','scenes','campaign_members','token_owners')
  AND column_name IN ('id','campaign_id','scene_id','hp_current','hp_max','data_json','owner_id','role','character_id','token_id','user_id')
ORDER BY table_name, column_name;
SELECT n.nspname AS schema_name, p.proname, p.prosecdef AS security_definer,
       pg_get_userbyid(p.proowner) AS owner,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
 AND p.proname IN ('apply_token_hp_atomic','is_campaign_dm','user_campaign_ids','user_dm_campaign_ids')
ORDER BY p.proname;
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
 AND tablename IN ('tokens','characters','campaign_members','token_owners')
ORDER BY tablename, policyname;
