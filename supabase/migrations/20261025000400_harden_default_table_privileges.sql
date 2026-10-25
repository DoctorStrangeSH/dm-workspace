-- Prevent future tables created by the migration role in public from granting
-- anonymous mutation privileges by default.
--
-- ALTER DEFAULT PRIVILEGES only affects objects created by the role executing
-- this migration (and does not override global defaults). Keep SELECT defaults
-- unchanged so existing public read-only use cases are not broken.

alter default privileges in schema public
  revoke insert, update, delete, truncate, references, trigger
  on tables
  from anon, public;
