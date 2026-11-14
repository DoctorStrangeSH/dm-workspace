-- Token art is private. Objects are immutable and scoped to an existing token.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('token-art', 'token-art', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']);

CREATE POLICY "Read current visible token art" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'token-art' AND EXISTS (
    SELECT 1 FROM public.tokens t
    JOIN public.campaign_members cm ON cm.campaign_id = t.campaign_id AND cm.user_id = (SELECT auth.uid())
    WHERE t.image_url = storage.objects.name
      AND split_part(storage.objects.name, '/', 1) = t.campaign_id::text
      AND split_part(storage.objects.name, '/', 2) = t.scene_id::text
      AND split_part(storage.objects.name, '/', 3) = t.id::text
      AND (NOT t.is_hidden OR cm.role = 'dm')
  )
);

CREATE POLICY "Upload own token art" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'token-art'
  AND storage.objects.name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|webp)$'
  AND EXISTS (
    SELECT 1 FROM public.tokens t
    JOIN public.campaign_members cm ON cm.campaign_id = t.campaign_id AND cm.user_id = (SELECT auth.uid())
    WHERE split_part(storage.objects.name, '/', 1) = t.campaign_id::text
      AND split_part(storage.objects.name, '/', 2) = t.scene_id::text
      AND split_part(storage.objects.name, '/', 3) = t.id::text
      AND (cm.role = 'dm' OR t.owner_id = (SELECT auth.uid()))
  )
);
