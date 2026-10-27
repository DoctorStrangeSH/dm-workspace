-- Make campaign music private after deploying the authorized audio route.
-- Staged separately so it can be validated without changing DEV/production.
begin;

update storage.buckets
set public = false
where id = 'music';

drop policy if exists "Anyone can view music" on storage.objects;
drop policy if exists "Campaign members can read music" on storage.objects;
create policy "Campaign members can read music"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'music'
  and exists (
    select 1
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.campaign_id::text = (storage.foldername(name))[1]
      and exists (
        select 1
        from public.tracks t
        where t.campaign_id = cm.campaign_id
          and (
            t.audio_url = storage.objects.name
            or t.audio_url like '%/storage/v1/object/public/music/' || storage.objects.name
          )
      )
  )
);

drop policy if exists "Campaign DMs can delete music" on storage.objects;
create policy "Campaign DMs can delete music"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'music'
  and exists (
    select 1
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
      and cm.campaign_id::text = (storage.foldername(name))[1]
  )
);

commit;
