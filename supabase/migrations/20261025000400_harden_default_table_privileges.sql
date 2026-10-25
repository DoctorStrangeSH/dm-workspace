-- Harden default table privileges for both roles used to create public tables.
--
-- PostgreSQL default privileges are per creator role. This migration must run
-- with permission to alter defaults for both postgres and supabase_admin.
-- There are no global table defaults to override in the audited dev project.
--
-- Keep SELECT and normal row-level DML for authenticated users unchanged, but
-- do not grant table-maintenance or schema/trigger-management privileges to
-- client roles on newly created tables.

alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger, maintain
  on tables
  from anon, public;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain
  on tables
  from authenticated;

alter default privileges for role supabase_admin in schema public
  revoke insert, update, delete, truncate, references, trigger, maintain
  on tables
  from anon, public;

alter default privileges for role supabase_admin in schema public
  revoke truncate, references, trigger, maintain
  on tables
  from authenticated;
