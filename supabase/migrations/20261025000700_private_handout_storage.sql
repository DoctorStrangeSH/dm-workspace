-- IMPORTANT: deploy the authorized /api/handouts/[id]/image route to DEV
-- BEFORE applying this migration. Never run against production without staging.
-- Ensure existing handouts.image_url values refer to the correct campaign path.
-- Previously issued public URLs may remain cached; do not treat this as revocation.
begin;

-- Remove open read access and authorize reads only when the corresponding
-- handout row is visible through the caller's existing handouts RLS.
drop policy if exists "Anyone can view handouts" on storage.objects;

create policy "Members can read authorized handout files"
on storage.objects for select to authenticated
using (
  bucket_id = 'handouts'
  and exists (
    select 1 from public.handouts h
    where (
      h.image_url = storage.objects.name
      or h.image_url like '%/storage/v1/object/public/handouts/' || storage.objects.name
    )
    and split_part(storage.objects.name, '/', 1) = h.campaign_id::text
  )
);

update storage.buckets set public = false where id = 'handouts';
commit;
