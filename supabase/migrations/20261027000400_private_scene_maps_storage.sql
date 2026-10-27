-- Make scene maps private after deploying the authorized map route.
-- Keep existing campaign-DM upload policy unchanged.
begin;

update storage.buckets
set public = false
where id = 'scene-maps';

drop policy if exists "Anyone can view scene maps" on storage.objects;
drop policy if exists "Campaign members can read scene maps" on storage.objects;
create policy "Campaign members can read scene maps"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'scene-maps'
  and exists (
    select 1
    from public.campaign_members cm
    join public.scenes s on s.campaign_id = cm.campaign_id
    where cm.user_id = (select auth.uid())
      and cm.campaign_id::text = (storage.foldername(name))[1]
      and s.id::text || '-' = split_part(split_part(storage.objects.name, '/', 2), '-', 1) || '-'
      and (
        s.image_url = storage.objects.name
        or s.image_url like '%/storage/v1/object/public/scene-maps/' || storage.objects.name
      )
  )
);

drop policy if exists "Campaign DMs can delete scene maps" on storage.objects;
create policy "Campaign DMs can delete scene maps"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'scene-maps'
  and exists (
    select 1
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
      and cm.campaign_id::text = (storage.foldername(name))[1]
  )
);

commit;
