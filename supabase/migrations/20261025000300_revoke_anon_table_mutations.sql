-- Anonymous clients should never mutate application tables directly.
-- Keep existing SELECT grants unchanged in this pass to avoid breaking public
-- read-only flows; RLS remains an additional layer of protection.
--
-- MAINTAIN is also revoked from client roles: it is a table-maintenance
-- privilege and is not needed by the browser application.

do $$
declare
  t record;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger, maintain on table public.%I from anon, public',
      t.tablename
    );
    execute format(
      'revoke maintain on table public.%I from authenticated',
      t.tablename
    );
  end loop;
end;
$$;
