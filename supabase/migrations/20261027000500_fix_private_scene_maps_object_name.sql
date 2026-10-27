-- Fix unqualified name binding in the scene-map Storage SELECT policy.
-- In a nested JOIN of public.scenes s, storage.foldername(name) resolved to
-- s.name instead of storage.objects.name, denying legitimately linked maps.
-- Keep this migration AFTER 20261027000400_private_scene_maps_storage.sql.
begin;

drop policy if exists "Campaign members can read scene maps" on storage.objects;
create policy "Campaign members can read scene maps"
on storage.objects
for select to authenticated
using (
  bucket_id = 'scene-maps'
  and exists (
    select 1
    from public.campaign_members cm
    join public.scenes s on s.campaign_id = cm.campaign_id
    where cm.user_id = (select auth.uid())
      and cm.campaign_id::text = (storage.foldername(storage.objects.name))[1]
      and (
        s.image_url = storage.objects.name
        or s.image_url like '%/storage/v1/object/public/scene-maps/' || storage.objects.name
      )
  )
);

commit;
