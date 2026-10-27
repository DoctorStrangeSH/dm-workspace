-- Make handout assets private after the application uses the authorized image route.
-- Stage this migration in DEV only after deploying the compatible application.
begin;

update storage.buckets
set public = false
where id = 'handouts';

drop policy if exists "Anyone can view handouts" on storage.objects;
drop policy if exists "Campaign members can read visible handouts" on storage.objects;
create policy "Campaign members can read visible handouts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'handouts'
  and exists (
    select 1
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.campaign_id::text = (storage.foldername(name))[1]
      and (
        cm.role = 'dm'
        or exists (
          select 1
          from public.handouts h
          where h.campaign_id = cm.campaign_id
            and h.is_visible = true
            and (
              h.image_url = storage.objects.name
              or h.image_url like '%/storage/v1/object/public/handouts/' || storage.objects.name
            )
        )
      )
  )
);

drop policy if exists "Campaign DMs can delete handouts" on storage.objects;
create policy "Campaign DMs can delete handouts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'handouts'
  and exists (
    select 1
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
      and cm.campaign_id::text = (storage.foldername(name))[1]
  )
);

commit;
