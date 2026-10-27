-- Disposable PostgreSQL fixture for PR #37 security migrations.
-- Used ONLY by the isolated GitHub Actions PostgreSQL service.
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA realtime;
CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA public, auth, realtime, storage TO authenticated, anon;

CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.realtime.topic', true), '')
$$;
CREATE TABLE realtime.messages (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, extension text NOT NULL);
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can receive broadcasts" ON realtime.messages FOR SELECT TO authenticated USING (true);
INSERT INTO realtime.messages (extension) VALUES ('broadcast');
GRANT SELECT ON realtime.messages TO authenticated, anon;

CREATE TABLE realtime.sent (event text NOT NULL, topic text NOT NULL, payload jsonb NOT NULL, private boolean NOT NULL);
CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO realtime.sent(event, topic, payload, private) VALUES ($2, $3, $1, $4)
$$;
CREATE FUNCTION realtime.broadcast_changes(
  topic_name text, event_name text, operation text, table_name text,
  table_schema text, new record, old record, level text DEFAULT 'ROW'
) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;

CREATE TABLE public.campaign_members (campaign_id uuid NOT NULL, user_id uuid NOT NULL, role text NOT NULL);
CREATE TABLE public.scenes (
  id uuid PRIMARY KEY, campaign_id uuid NOT NULL, name text NOT NULL DEFAULT 'Map scene', image_url text
);
CREATE TABLE public.handouts (
  id uuid PRIMARY KEY, campaign_id uuid NOT NULL, name text NOT NULL,
  image_url text, is_visible boolean NOT NULL DEFAULT false
);
CREATE TABLE public.tracks (id uuid PRIMARY KEY, campaign_id uuid NOT NULL, audio_url text);
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean NOT NULL);
CREATE TABLE storage.objects (bucket_id text NOT NULL, name text NOT NULL);
CREATE FUNCTION storage.foldername(name text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1, '/') $$;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('handouts','handouts',true),
  ('music','music',true),
  ('scene-maps','scene-maps',true);
CREATE POLICY "Anyone can view handouts" ON storage.objects FOR SELECT USING (bucket_id='handouts');
CREATE POLICY "Anyone can view music" ON storage.objects FOR SELECT USING (bucket_id='music');
CREATE POLICY "Anyone can view scene maps" ON storage.objects FOR SELECT USING (bucket_id='scene-maps');
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, DELETE ON storage.objects TO authenticated, anon;
GRANT SELECT ON public.campaign_members, public.scenes, public.handouts, public.tracks TO authenticated, anon;

-- Existing trigger functions that the Realtime migration hardens via ALTER FUNCTION.
DO $$
DECLARE fname text;
BEGIN
  FOREACH fname IN ARRAY ARRAY[
    'broadcast_fog_changes', 'broadcast_message_changes',
    'broadcast_music_state', 'broadcast_token_changes'
  ]
  LOOP
    EXECUTE format(
      'CREATE FUNCTION public.%I() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $f$ BEGIN RETURN coalesce(new, old); END; $f$',
      fname
    );
  END LOOP;
END $$;

INSERT INTO public.campaign_members (campaign_id,user_id,role) VALUES
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dm'),
 ('11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','player'),
 ('22222222-2222-4222-8222-222222222222','cccccccc-cccc-4ccc-8ccc-cccccccccccc','dm');
INSERT INTO public.scenes(id,campaign_id,image_url) VALUES
 ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png'),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222/44444444-4444-4444-8444-444444444444-ffffffff-ffff-4fff-8fff-ffffffffffff.png');
INSERT INTO public.handouts(id,campaign_id,name,image_url,is_visible) VALUES
 ('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111','Visible','11111111-1111-4111-8111-111111111111/55555555-5555-4555-8555-555555555555.png',true),
 ('66666666-6666-4666-8666-666666666666','11111111-1111-4111-8111-111111111111','Hidden','11111111-1111-4111-8111-111111111111/66666666-6666-4666-8666-666666666666.png',false),
 ('77777777-7777-4777-8777-777777777777','22222222-2222-4222-8222-222222222222','Foreign','22222222-2222-4222-8222-222222222222/77777777-7777-4777-8777-777777777777.png',true);
INSERT INTO public.tracks(id,campaign_id,audio_url) VALUES
 ('88888888-8888-4888-8888-888888888888','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111/88888888-8888-4888-8888-888888888888.mp3'),
 ('99999999-9999-4999-8999-999999999999','22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222/99999999-9999-4999-8999-999999999999.mp3');
INSERT INTO storage.objects(bucket_id,name) VALUES
 ('handouts','11111111-1111-4111-8111-111111111111/55555555-5555-4555-8555-555555555555.png'),
 ('handouts','11111111-1111-4111-8111-111111111111/66666666-6666-4666-8666-666666666666.png'),
 ('handouts','22222222-2222-4222-8222-222222222222/77777777-7777-4777-8777-777777777777.png'),
 ('music','11111111-1111-4111-8111-111111111111/88888888-8888-4888-8888-888888888888.mp3'),
 ('music','22222222-2222-4222-8222-222222222222/99999999-9999-4999-8999-999999999999.mp3'),
 ('scene-maps','11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png'),
 ('scene-maps','22222222-2222-4222-8222-222222222222/44444444-4444-4444-8444-444444444444-ffffffff-ffff-4fff-8fff-ffffffffffff.png');
