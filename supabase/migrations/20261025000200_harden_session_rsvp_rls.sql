-- Ensure RSVP writes are restricted to sessions in campaigns the caller belongs to.
-- The server action already checks membership, but direct PostgREST calls must be
-- protected by RLS as well.

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'session_rsvp'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.session_rsvp', p.policyname);
  end loop;
end;
$$;

create policy "Members can create own session RSVP"
on public.session_rsvp
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.sessions s
    join public.campaign_members cm on cm.campaign_id = s.campaign_id
    where s.id = session_rsvp.session_id
      and cm.user_id = (select auth.uid())
  )
);

create policy "Members can update own session RSVP"
on public.session_rsvp
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.sessions s
    join public.campaign_members cm on cm.campaign_id = s.campaign_id
    where s.id = session_rsvp.session_id
      and cm.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.sessions s
    join public.campaign_members cm on cm.campaign_id = s.campaign_id
    where s.id = session_rsvp.session_id
      and cm.user_id = (select auth.uid())
  )
);

create policy "Members can delete own session RSVP"
on public.session_rsvp
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.sessions s
    join public.campaign_members cm on cm.campaign_id = s.campaign_id
    where s.id = session_rsvp.session_id
      and cm.user_id = (select auth.uid())
  )
);
