-- Disposable CI PostgreSQL only. All fixture and policy changes roll back.
BEGIN;
ALTER TABLE storage.buckets ADD COLUMN file_size_limit bigint, ADD COLUMN allowed_mime_types text[];
CREATE TABLE public.tokens (id uuid PRIMARY KEY, campaign_id uuid NOT NULL, scene_id uuid NOT NULL, owner_id uuid, image_url text, is_hidden boolean NOT NULL DEFAULT false);
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tokens TO authenticated, anon;
GRANT INSERT, UPDATE ON storage.objects TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA storage TO authenticated;
CREATE POLICY token_fixture_read ON public.tokens FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.campaign_members cm WHERE cm.campaign_id = tokens.campaign_id AND cm.user_id = auth.uid() AND (NOT tokens.is_hidden OR cm.role = 'dm'))
);
\ir ../migrations/20261114073437_private_token_art.sql

INSERT INTO public.tokens VALUES
 ('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',NULL,false),
 ('66666666-6666-4666-8666-666666666666','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',NULL,NULL,true),
 ('77777777-7777-4777-8777-777777777777','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444',NULL,NULL,false);
UPDATE public.tokens SET image_url = campaign_id || '/' || scene_id || '/' || id || '/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png';
INSERT INTO storage.objects(bucket_id,name) SELECT 'token-art',image_url FROM public.tokens;
INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','unreferenced.png');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM storage.objects WHERE bucket_id = 'token-art') <> 2 THEN RAISE EXCEPTION 'DM visibility mismatch'; END IF;
  INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333/66666666-6666-4666-8666-666666666666/ffffffff-ffff-4fff-8fff-ffffffffffff.webp');
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','22222222-2222-4222-8222-222222222222/44444444-4444-4444-8444-444444444444/77777777-7777-4777-8777-777777777777/ffffffff-ffff-4fff-8fff-ffffffffffff.png');
    RAISE EXCEPTION 'Foreign upload accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $$ DECLARE changed integer; BEGIN
  IF (SELECT count(*) FROM storage.objects WHERE bucket_id = 'token-art') <> 1 THEN RAISE EXCEPTION 'Player sees hidden, foreign or unreferenced art'; END IF;
  INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333/55555555-5555-4555-8555-555555555555/ffffffff-ffff-4fff-8fff-ffffffffffff.png');
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333/66666666-6666-4666-8666-666666666666/ffffffff-ffff-4fff-8fff-ffffffffffff.png');
    RAISE EXCEPTION 'Hidden nonowner upload accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','11111111-1111-4111-8111-111111111111/44444444-4444-4444-8444-444444444444/55555555-5555-4555-8555-555555555555/ffffffff-ffff-4fff-8fff-ffffffffffff.png');
    RAISE EXCEPTION 'Foreign scene upload accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('token-art','11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333/55555555-5555-4555-8555-555555555555/../../bad.svg');
    RAISE EXCEPTION 'Malformed upload accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE storage.objects SET name = 'replaced.png' WHERE bucket_id = 'token-art';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Immutable art replaced'; END IF;
  DELETE FROM storage.objects WHERE bucket_id = 'token-art';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Art deleted'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM storage.objects WHERE bucket_id = 'token-art') <> 1 THEN RAISE EXCEPTION 'Crosscampaign art exposed'; END IF;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'token-art') THEN RAISE EXCEPTION 'Anonymous art exposed'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='token-art' AND NOT public AND file_size_limit=2097152 AND allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp']) THEN RAISE EXCEPTION 'Bucket protection mismatch'; END IF;
  RAISE NOTICE 'PASS: private token art is isolated by campaign, scene, visibility and ownership';
END $$;
ROLLBACK;
