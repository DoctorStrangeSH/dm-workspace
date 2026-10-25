-- Restrict uploads to the DM of the campaign encoded in the first folder.
-- This migration intentionally does NOT change bucket public flags or SELECT
-- policies. Public URL exposure is addressed in a separate application rollout.
-- All current DEV music/scene-maps objects use <campaign_uuid>/... paths.
-- Existing handouts bucket currently has zero objects.

drop policy if exists "Authenticated can upload handouts" on storage.objects;
drop policy if exists "Authenticated can upload music" on storage.objects;
drop policy if exists "Authenticated can upload scene maps" on storage.objects;
drop policy if exists "Owner can delete scene maps" on storage.objects;

create policy "Campaign DMs can upload handouts"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'handouts'
  and (storage.foldername(name))[1] in (
    select cm.campaign_id::text
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
  )
);

create policy "Campaign DMs can upload music"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'music'
  and (storage.foldername(name))[1] in (
    select cm.campaign_id::text
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
  )
);

create policy "Campaign DMs can upload scene maps"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'scene-maps'
  and (storage.foldername(name))[1] in (
    select cm.campaign_id::text
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
  )
);

create policy "Campaign DMs can delete scene maps"
on storage.objects for delete to authenticated
using (
  bucket_id = 'scene-maps'
  and (storage.foldername(name))[1] in (
    select cm.campaign_id::text
    from public.campaign_members cm
    where cm.user_id = (select auth.uid())
      and cm.role = 'dm'
  )
);
