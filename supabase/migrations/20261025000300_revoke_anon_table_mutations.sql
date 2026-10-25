-- Anonymous clients should never mutate application tables directly.
-- Keep existing SELECT grants unchanged in this pass to avoid breaking public
-- read-only flows; RLS remains an additional layer of protection.

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
      'revoke insert, update, delete, truncate, references, trigger on table public.%I from anon',
      t.tablename
    );
  end loop;
end;
$$;
