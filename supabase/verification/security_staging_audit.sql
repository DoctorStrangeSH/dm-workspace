-- Read-only verification queries for the Supabase security migrations.
-- Run in the Supabase SQL Editor on STAGING after applying PRs #31-#34.
-- These queries inspect ACLs/policies; they do not prove every application flow.
-- Do not paste credentials or service-role keys into source control.

-- 1) Effective table privileges for anon/authenticated on current public tables.
select
  c.relname as table_name,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
  has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
  has_table_privilege('anon', c.oid, 'DELETE') as anon_delete,
  has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select,
  has_table_privilege('authenticated', c.oid, 'INSERT') as authenticated_insert,
  has_table_privilege('authenticated', c.oid, 'UPDATE') as authenticated_update,
  has_table_privilege('authenticated', c.oid, 'DELETE') as authenticated_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- Expected after PR #33: anon_insert/update/delete are false for all public tables.
-- authenticated privileges may remain true; RLS policies must constrain access.

-- 2) Explicit grants to PUBLIC/anon on current public tables.
select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon')
order by table_name, grantee, privilege_type;

-- Expected after PR #33: no INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER
-- grants to PUBLIC or anon on public tables. Review any remaining rows carefully.

-- 3) RLS status and policies for application tables.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  p.polname as policy_name,
  p.polcmd as command,
  p.polroles::regrole[] as roles,
  pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_get_expr(p.polwithcheck, p.polrelid) as check_expression
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname, p.polname;

-- Expected: RLS remains enabled. Review session_rsvp policies for authenticated
-- SELECT/INSERT/UPDATE/DELETE and membership checks in the referenced session's
-- campaign. RLS enabled alone does not prove a policy is correct.

-- 4) Default privileges configured for objects created by different roles.
-- Defaults are per creator role. This shows role-specific defaults in public.
select
  creator.rolname as creator_role,
  d.defaclobjtype as object_type,
  coalesce(grantee.rolname, 'PUBLIC') as grantee,
  x.privilege_type,
  x.is_grantable
from pg_default_acl d
join pg_namespace n on n.oid = d.defaclnamespace
join pg_roles creator on creator.oid = d.defaclrole
cross join lateral aclexplode(d.defaclacl) x
left join pg_roles grantee on grantee.oid = x.grantee
where n.nspname = 'public'
  and d.defaclobjtype = 'r'
order by creator.rolname, grantee, x.privilege_type;

-- Important: PR #34 changes defaults only for the role that executes that
-- migration and only schema-specific defaults. Check global defaults too:
select
  creator.rolname as creator_role,
  d.defaclobjtype as object_type,
  coalesce(grantee.rolname, 'PUBLIC') as grantee,
  x.privilege_type,
  x.is_grantable
from pg_default_acl d
join pg_roles creator on creator.oid = d.defaclrole
cross join lateral aclexplode(d.defaclacl) x
left join pg_roles grantee on grantee.oid = x.grantee
where d.defaclnamespace is null
  and d.defaclobjtype = 'r'
order by creator.rolname, grantee, x.privilege_type;

-- 5) SECURITY DEFINER functions and who can execute them.
select
  p.oid::regprocedure as function_signature,
  r.rolname as grantee,
  x.privilege_type,
  x.is_grantable
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_roles owner_role on owner_role.oid = p.proowner
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x
left join pg_roles r on r.oid = x.grantee
where n.nspname = 'public'
  and p.prosecdef
  and x.privilege_type = 'EXECUTE'
order by p.oid::regprocedure::text, grantee;

-- Review every SECURITY DEFINER function callable by PUBLIC/anon. Some are
-- trigger-only and can usually have client EXECUTE revoked, but confirm actual
-- RPC usage before changing grants. Trigger invocation itself does not require
-- the calling user to have EXECUTE on the trigger function.

-- Manual functional tests (use separate test accounts, not production users):
-- A. DM: can read/manage campaign data and create session RSVPs as intended.
-- B. Member player: can read visible content and RSVP only in their campaign.
-- C. Unrelated authenticated user: cannot call campaign RPCs for another campaign,
--    inspect hidden chapters/entities, or read/modify another campaign's RSVPs.
-- D. Anonymous client: cannot mutate any public application table.
-- E. Existing public read-only flows (e.g. SRD lookup) still work if intended.
-- F. Change an RSVP's session_id to a session in another campaign; UPDATE must fail.
-- G. Verify RPCs are unavailable to anon and executable by authenticated only where
--    intended. Record results before considering production rollout.