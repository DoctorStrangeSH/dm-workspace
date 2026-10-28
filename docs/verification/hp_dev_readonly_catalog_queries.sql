-- HP DEV catalog checkpoint, 2026-10-28.
-- Exact read-only inspection batches used for the report. No automatic runner.
-- Target was independently verified as DEV yoondivyeueyrtgeldja.
-- No installed application RPC is invoked; no player rows are selected.
-- Each batch has its own snapshot; they are not one global atomic snapshot.

-- A: function definitions and effective rights
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '10s';
SELECT jsonb_build_object(
  'captured_at', transaction_timestamp(),
  'read_only', current_setting('transaction_read_only'),
  'server_version', current_setting('server_version'),
  'functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'oid', p.oid, 'signature', p.oid::regprocedure::text,
      'owner', pg_get_userbyid(p.proowner), 'security_definer', p.prosecdef,
      'language', l.lanname, 'config', p.proconfig,
      'acl', (SELECT jsonb_agg(jsonb_build_object('grantee', CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END, 'privilege', x.privilege_type, 'grantable', x.is_grantable))
              FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) x),
      'effective_execute', (SELECT jsonb_object_agg(r.rolname, has_function_privilege(r.oid,p.oid,'EXECUTE'))
                            FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')),
      'definition', pg_get_functiondef(p.oid)
    ) ORDER BY p.proname, p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
    WHERE n.nspname='public' AND p.proname IN ('apply_token_hp_atomic','update_character_data_cas','update_character_identity_atomic','create_linked_token_atomic','level_up_character_tokens')
  ), '[]'::jsonb),
  'roles', (SELECT jsonb_agg(jsonb_build_object('role',r.rolname,'superuser',r.rolsuper,'bypass_rls',r.rolbypassrls,'inherit',r.rolinherit,
      'memberships',(SELECT jsonb_agg(jsonb_build_object('role',parent.rolname,'usable_without_set_role',pg_has_role(r.oid,parent.oid,'USAGE')))
                     FROM pg_roles parent WHERE parent.oid<>r.oid AND pg_has_role(r.oid,parent.oid,'MEMBER')))
    ORDER BY r.rolname) FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role','postgres'))
) AS evidence;
COMMIT;

-- B: table shape, policies and table/column rights
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '10s';
WITH targets AS (
 SELECT c.oid,c.relname,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname IN ('tokens','characters','scenes','campaigns','campaign_members','token_owners')
)
SELECT jsonb_build_object(
 'captured_at',transaction_timestamp(),'read_only',current_setting('transaction_read_only'),
 'tables',(SELECT jsonb_agg(jsonb_build_object(
  'table',t.relname,'owner',pg_get_userbyid(t.relowner),'rls',t.relrowsecurity,'force_rls',t.relforcerowsecurity,
  'acl',t.relacl::text,
  'columns',(SELECT jsonb_agg(jsonb_build_object('column',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
             FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped),
  'constraints',(SELECT jsonb_agg(jsonb_build_object('name',k.conname,'type',k.contype,'definition',pg_get_constraintdef(k.oid)) ORDER BY k.conname) FROM pg_constraint k WHERE k.conrelid=t.oid),
  'indexes',(SELECT jsonb_agg(jsonb_build_object('name',i.indexname,'definition',i.indexdef) ORDER BY i.indexname) FROM pg_indexes i WHERE i.schemaname='public' AND i.tablename=t.relname),
  'privileges',(SELECT jsonb_agg(jsonb_build_object('role',r.rolname,'select',has_table_privilege(r.oid,t.oid,'SELECT'),'insert',has_table_privilege(r.oid,t.oid,'INSERT'),'update',has_table_privilege(r.oid,t.oid,'UPDATE'),'delete',has_table_privilege(r.oid,t.oid,'DELETE'),'truncate',has_table_privilege(r.oid,t.oid,'TRUNCATE'),
    'column_update',(SELECT jsonb_object_agg(a.attname,has_column_privilege(r.oid,t.oid,a.attnum,'UPDATE')) FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped))
    ORDER BY r.rolname) FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role'))
 ) ORDER BY t.relname) FROM targets t),
 'policies',(SELECT jsonb_agg(jsonb_build_object('table',p.tablename,'name',p.policyname,'permissive',p.permissive,'roles',p.roles,'command',p.cmd,'using',p.qual,'with_check',p.with_check) ORDER BY p.tablename,p.policyname)
             FROM pg_policies p WHERE p.schemaname='public' AND p.tablename IN (SELECT relname FROM targets)),
 'migration_ledger_columns',(SELECT jsonb_agg(jsonb_build_object('name',column_name,'type',data_type) ORDER BY ordinal_position)
 FROM information_schema.columns WHERE table_schema='supabase_migrations' AND table_name='schema_migrations')
) AS evidence;
COMMIT;

-- C: triggers, helpers, bounded source scan, dependencies and ledger fingerprints
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='10s';
WITH targets AS (
 SELECT c.oid,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('tokens','characters','scenes','campaigns','campaign_members','token_owners')
), selected_functions AS (
 SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('apply_token_hp_atomic','update_character_data_cas','update_character_identity_atomic')
)
SELECT jsonb_build_object(
 'captured_at',transaction_timestamp(),'read_only',current_setting('transaction_read_only'),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('table',t.relname,'name',g.tgname,'internal',g.tgisinternal,'enabled',g.tgenabled,
   'definition',pg_get_triggerdef(g.oid),'function',g.tgfoid::regprocedure::text,
   'function_definition',CASE WHEN NOT g.tgisinternal THEN pg_get_functiondef(g.tgfoid) ELSE NULL END)
   ORDER BY t.relname,g.tgname) FROM targets t JOIN pg_trigger g ON g.tgrelid=t.oid),
 'policy_helpers',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),
   'security_definer',p.prosecdef,'config',p.proconfig,'definition',pg_get_functiondef(p.oid)) ORDER BY p.proname)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('is_campaign_dm','user_campaign_ids','user_dm_campaign_ids')),
 'public_source_matches',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'oid',p.oid,'language',l.lanname,'owner',pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,'body_md5',md5(p.prosrc)) ORDER BY p.proname)
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
   WHERE n.nspname='public' AND p.prokind IN ('f','p') AND p.prosrc ~* '(tokens|characters|apply_token_hp_atomic|update_character_data_cas)'),
 'catalog_dependencies',(SELECT jsonb_agg(jsonb_build_object('object',pg_describe_object(d.classid,d.objid,d.objsubid),
   'depends_on',pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid),'type',d.deptype))
   FROM pg_depend d WHERE (d.classid='pg_proc'::regclass AND d.objid IN (SELECT oid FROM selected_functions))
     OR (d.refclassid='pg_proc'::regclass AND d.refobjid IN (SELECT oid FROM selected_functions))),
 'ledger',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name,'statement_count',cardinality(statements),
   'statements_md5',md5(array_to_string(statements,E'\n'))) ORDER BY version) FROM supabase_migrations.schema_migrations)
) AS evidence;
COMMIT;

-- D: constant JSON expressions only; no application function or rows
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='5s';
WITH samples(label,data) AS (VALUES
 ('missing_hp','{}'::jsonb),
 ('missing_current','{"hp":{"max":20}}'::jsonb),
 ('missing_max','{"hp":{"current":20}}'::jsonb),
 ('valid','{"hp":{"current":20,"max":20}}'::jsonb)
), checks AS (
 SELECT label,data,
  (jsonb_typeof(data->'hp') <> 'object'
   OR jsonb_typeof(data->'hp'->'current') <> 'number'
   OR jsonb_typeof(data->'hp'->'max') <> 'number'
   OR (data->'hp'->>'current') !~ '^[0-9]+$'
   OR (data->'hp'->>'max') !~ '^[0-9]+$') AS original_type_guard,
  ((data->'hp'->>'max')::integer <= 0
   OR (data->'hp'->>'current')::integer < 0
   OR (data->'hp'->>'current')::integer > (data->'hp'->>'max')::integer
   OR (data->'hp'->>'max')::integer <> 20
   OR (data->'hp'->>'current')::integer <> 20) AS original_consistency_guard,
  jsonb_set(data,'{hp,current}',to_jsonb(13),false) AS patched_character_json
 FROM samples
)
SELECT jsonb_build_object(
 'captured_at',transaction_timestamp(),'read_only',current_setting('transaction_read_only'),
 'scope','Constant JSON expressions only; no application rows and no HP RPC invocation',
 'results',(SELECT jsonb_agg(jsonb_build_object(
  'case',label,'type_guard',original_type_guard,'consistency_guard',original_consistency_guard,
  'if_would_raise',COALESCE(original_type_guard,false) OR COALESCE(original_consistency_guard,false),
  'patched_character_json',patched_character_json
 ) ORDER BY label) FROM checks)
) AS evidence;
COMMIT;

-- E: literal routine-name scan of recorded migration statements; no SQL execution
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='5s';
WITH ledger AS (
 SELECT version,name,lower(COALESCE(array_to_string(statements,E'\n'),'')) AS body
 FROM supabase_migrations.schema_migrations
)
SELECT jsonb_build_object(
 'captured_at',transaction_timestamp(),'read_only',current_setting('transaction_read_only'),
 'ledger_name_scan',(SELECT jsonb_agg(jsonb_build_object(
  'version',version,'name',name,
  'mentions_hp_rpc',strpos(body,'apply_token_hp_atomic')>0,
  'mentions_character_cas',strpos(body,'update_character_data_cas')>0,
  'mentions_character_identity',strpos(body,'update_character_identity_atomic')>0
 ) ORDER BY version) FROM ledger)
) AS evidence;
COMMIT;
