-- Run after all four staged PR #37 migrations, against disposable CI PostgreSQL only.
\set ON_ERROR_STOP on
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id IN ('handouts','music','scene-maps') AND public) THEN
    RAISE EXCEPTION 'Private Storage bucket is still public';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname LIKE 'Anyone can view %' AND (qual LIKE '%handouts%' OR qual LIKE '%music%' OR qual LIKE '%scene-maps%')) THEN
    RAISE EXCEPTION 'Broad public Storage SELECT policy survived';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname='Authenticated can receive broadcasts') THEN
    RAISE EXCEPTION 'Broad Realtime policy survived';
  END IF;
END $$;

-- Tests below exercise PostgreSQL RLS as an authenticated non-DM campaign-A player.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);
SELECT set_config('app.realtime.topic','handouts-visible:11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c FROM storage.objects WHERE bucket_id='handouts';
  IF c <> 1 THEN RAISE EXCEPTION 'Player should see exactly one visible handout; saw %',c; END IF;
  SELECT count(*) INTO c FROM storage.objects WHERE bucket_id='music';
  IF c <> 1 THEN RAISE EXCEPTION 'Player should see one campaign music track; saw %',c; END IF;
  SELECT count(*) INTO c FROM storage.objects WHERE bucket_id='scene-maps';
  IF c <> 1 THEN RAISE EXCEPTION 'Player should see one campaign scene map; saw %',c; END IF;
  SELECT count(*) INTO c FROM realtime.messages;
  IF c <> 1 THEN RAISE EXCEPTION 'Player missing authorized safe handout topic'; END IF;
END $$;
SELECT set_config('app.realtime.topic','summons:11111111-1111-4111-8111-111111111111',false);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Player received DM-only summons topic'; END IF;
END $$;
SELECT set_config('app.realtime.topic','handouts:11111111-1111-4111-8111-111111111111',false);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Player received DM-only legacy handout topic'; END IF;
END $$;
SELECT set_config('app.realtime.topic','handouts-visible:22222222-2222-4222-8222-222222222222',false);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Player received foreign campaign broadcast'; END IF;
END $$;
SELECT set_config('app.realtime.topic','campaign:11111111-1111-4111-8111-111111111111',false);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Legacy catch-all unexpectedly allowed'; END IF;
END $$;

-- Outsider: no campaign membership; cannot read Storage or subscribe.
SELECT set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',false);
SELECT set_config('app.realtime.topic','messages:11111111-1111-4111-8111-111111111111',false);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects) THEN RAISE EXCEPTION 'Outsider read private Storage'; END IF;
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Outsider received campaign broadcast'; END IF;
END $$;

-- Campaign-A DM may read hidden handouts and receive DM-only topic.
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
SELECT set_config('app.realtime.topic','summons:11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c FROM storage.objects WHERE bucket_id='handouts';
  IF c <> 2 THEN RAISE EXCEPTION 'DM cannot read campaign hidden handouts; saw %',c; END IF;
  SELECT count(*) INTO c FROM realtime.messages;
  IF c <> 1 THEN RAISE EXCEPTION 'DM cannot receive summons stream'; END IF;
END $$;

-- Campaign-B DM cannot view campaign-A assets.
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false);
SELECT set_config('app.realtime.topic','handouts-visible:11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c FROM storage.objects WHERE bucket_id='handouts';
  IF c <> 1 THEN RAISE EXCEPTION 'Campaign-B DM saw another campaign handout'; END IF;
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Campaign-B DM heard campaign-A broadcast'; END IF;
END $$;

-- Anonymous role must not receive Storage or Realtime rows.
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects) THEN RAISE EXCEPTION 'Anonymous role read private Storage'; END IF;
  IF EXISTS (SELECT 1 FROM realtime.messages) THEN RAISE EXCEPTION 'Anonymous role read Realtime messages'; END IF;
END $$;
RESET ROLE;

-- Ensure safe trigger emits only allowed fields and correct visibility changes.
CREATE TRIGGER test_handout_changes AFTER INSERT OR UPDATE OR DELETE
ON public.handouts FOR EACH ROW EXECUTE FUNCTION public.broadcast_handout_changes();

INSERT INTO public.handouts(id,campaign_id,name,image_url,is_visible) VALUES
 ('abababab-abab-4bab-8bab-abababababab','11111111-1111-4111-8111-111111111111','New visible','SECRET_PATH_DO_NOT_BROADCAST',true),
 ('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd','11111111-1111-4111-8111-111111111111','Unpublished secret','HIDDEN_SECRET',false);
UPDATE public.handouts SET is_visible=false WHERE id='abababab-abab-4bab-8bab-abababababab';
UPDATE public.handouts SET is_visible=true WHERE id='cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd';
DELETE FROM public.handouts WHERE id='cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd';

DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c FROM realtime.sent WHERE topic='handouts-visible:11111111-1111-4111-8111-111111111111';
  IF c <> 4 THEN RAISE EXCEPTION 'Expected 4 visible lifecycle broadcasts; saw %', c; END IF;
  IF EXISTS (
    SELECT 1 FROM realtime.sent
    WHERE payload::text LIKE '%SECRET_PATH_DO_NOT_BROADCAST%'
       OR payload::text LIKE '%HIDDEN_SECRET%'
       OR payload::text LIKE '%image_url%'
  ) THEN RAISE EXCEPTION 'Broadcast exposed a private handout field'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM realtime.sent WHERE event='DELETE' AND payload->'old_record'->>'id'='abababab-abab-4bab-8bab-abababababab'
  ) THEN RAISE EXCEPTION 'Visibility-off did not emit DELETE event'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM realtime.sent WHERE event='DELETE' AND payload->'old_record'->>'id'='cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd'
  ) THEN RAISE EXCEPTION 'Visible row removal did not emit DELETE event'; END IF;
END $$;

SELECT 'PR #37 disposable PostgreSQL RLS and handout Broadcast tests passed' AS result;
