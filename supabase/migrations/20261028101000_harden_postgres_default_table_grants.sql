-- Harden default table privileges for tables created by postgres.
--
-- The audited dev SQL Editor session runs as postgres, but that role is not a
-- superuser and is not a member of supabase_admin. It therefore cannot alter
-- supabase_admin's default privileges. Do not attempt that change here: it
-- would fail due to insufficient privilege. Defaults for supabase_admin need
-- to be addressed separately by an authorized administrator.
--
-- Keep SELECT and normal row-level DML for authenticated users unchanged, but
-- remove anonymous mutation privileges and unnecessary maintenance/schema
-- privileges from future tables created by postgres.

alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger, maintain
  on tables
  from anon, public;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain
  on tables
  from authenticated;