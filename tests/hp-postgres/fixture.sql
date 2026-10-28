-- LOCAL TEST FIXTURE ONLY. Not a migration. Generated from captured catalog metadata.
-- See provenance.json and README.md for substitutions and omitted infrastructure.
DO $guard$ BEGIN
  IF current_database() !~ '^hp_lab_[a-f0-9]{16}$'
     OR inet_server_addr() IS DISTINCT FROM '127.0.0.1'::inet
     OR current_setting('hp_lab.isolated', true) IS DISTINCT FROM current_database()
  THEN RAISE EXCEPTION 'Refusing non-isolated HP fixture target'; END IF;
END $guard$;
CREATE ROLE postgres NOLOGIN NOSUPERUSER BYPASSRLS;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth AUTHORIZATION postgres;
CREATE SCHEMA hp_lab AUTHORIZATION postgres;
CREATE SCHEMA realtime AUTHORIZATION postgres;
GRANT CREATE ON SCHEMA public TO postgres;
SET ROLE postgres;
CREATE TYPE public.campaign_role AS ENUM ('dm', 'player');
-- Minimal external FK targets, not captured definitions of profiles/entities.
CREATE TABLE public.profiles (id uuid PRIMARY KEY);
CREATE TABLE public.entities (id uuid PRIMARY KEY);
-- Local identity shim. No Auth service, JWT verification or user sessions are emulated.
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA auth, hp_lab TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
CREATE TABLE hp_lab.outbox (topic text, operation text, relation_name text, new_row jsonb, old_row jsonb);
-- Transactional local sink only. This does not emulate the Realtime service.
CREATE FUNCTION realtime.broadcast_changes(text,text,text,text,text,record,record)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN
  INSERT INTO hp_lab.outbox VALUES ($1,$2,$4,to_jsonb($6),to_jsonb($7));
END $$;

CREATE TABLE public."campaign_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" campaign_role DEFAULT 'player'::campaign_role NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "genre" text,
  "description" text,
  "owner_id" uuid NOT NULL,
  "invite_code" text DEFAULT "substring"(md5((random())::text), 1, 8),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."characters" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "data_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_visible_to_party" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."scenes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "name" text NOT NULL,
  "image_url" text,
  "grid_type" text DEFAULT 'square'::text NOT NULL,
  "grid_size" integer DEFAULT 50 NOT NULL,
  "width" integer DEFAULT 30 NOT NULL,
  "height" integer DEFAULT 20 NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "fog_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."token_owners" (
  "token_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "campaign_id" uuid NOT NULL,
  "added_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."tokens" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "scene_id" uuid NOT NULL,
  "entity_id" uuid,
  "character_id" uuid,
  "owner_id" uuid,
  "name" text NOT NULL,
  "image_url" text,
  "x" integer DEFAULT 0 NOT NULL,
  "y" integer DEFAULT 0 NOT NULL,
  "size" integer DEFAULT 1 NOT NULL,
  "hp_current" integer,
  "hp_max" integer,
  "conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "color" text DEFAULT '#6366f1'::text NOT NULL,
  "is_hidden" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "campaign_id" uuid NOT NULL
);

ALTER TABLE public."campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_user_id_key" UNIQUE (campaign_id, user_id);

ALTER TABLE public."campaign_members" ADD CONSTRAINT "campaign_members_pkey" PRIMARY KEY (id);

ALTER TABLE public."campaigns" ADD CONSTRAINT "campaigns_invite_code_key" UNIQUE (invite_code);

ALTER TABLE public."campaigns" ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY (id);

ALTER TABLE public."characters" ADD CONSTRAINT "character_name_max_length" CHECK ((length(name) <= 150));

ALTER TABLE public."characters" ADD CONSTRAINT "character_name_not_empty" CHECK ((length(TRIM(BOTH FROM name)) > 0));

ALTER TABLE public."characters" ADD CONSTRAINT "characters_pkey" PRIMARY KEY (id);

ALTER TABLE public."scenes" ADD CONSTRAINT "scene_dimensions_positive" CHECK (((width > 0) AND (height > 0)));

ALTER TABLE public."scenes" ADD CONSTRAINT "scene_grid_size_positive" CHECK ((grid_size > 0));

ALTER TABLE public."scenes" ADD CONSTRAINT "scene_grid_type_valid" CHECK ((grid_type = ANY (ARRAY['square'::text, 'hex'::text, 'none'::text])));

ALTER TABLE public."scenes" ADD CONSTRAINT "scene_name_not_empty" CHECK ((length(TRIM(BOTH FROM name)) > 0));

ALTER TABLE public."scenes" ADD CONSTRAINT "scenes_pkey" PRIMARY KEY (id);

ALTER TABLE public."token_owners" ADD CONSTRAINT "token_owners_pkey" PRIMARY KEY (token_id, user_id);

ALTER TABLE public."tokens" ADD CONSTRAINT "token_name_not_empty" CHECK ((length(TRIM(BOTH FROM name)) > 0));

ALTER TABLE public."tokens" ADD CONSTRAINT "token_size_positive" CHECK (((size > 0) AND (size <= 10)));

ALTER TABLE public."tokens" ADD CONSTRAINT "tokens_pkey" PRIMARY KEY (id);

ALTER TABLE public."campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE public."campaign_members" ADD CONSTRAINT "campaign_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX idx_campaign_members_campaign_id ON public.campaign_members USING btree (campaign_id);

CREATE INDEX idx_campaign_members_user_id ON public.campaign_members USING btree (user_id);

ALTER TABLE public."campaign_members" ENABLE ROW LEVEL SECURITY;

GRANT select ON public."campaign_members" TO "anon";

GRANT select, insert, update, delete ON public."campaign_members" TO "authenticated";

GRANT select, insert, update, delete, truncate ON public."campaign_members" TO "service_role";

ALTER TABLE public."campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX idx_campaigns_owner_id ON public.campaigns USING btree (owner_id);

CREATE INDEX idx_campaigns_updated_at ON public.campaigns USING btree (updated_at DESC);

ALTER TABLE public."campaigns" ENABLE ROW LEVEL SECURITY;

GRANT select ON public."campaigns" TO "anon";

GRANT select, insert, update, delete ON public."campaigns" TO "authenticated";

GRANT select, insert, update, delete, truncate ON public."campaigns" TO "service_role";

ALTER TABLE public."characters" ADD CONSTRAINT "characters_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE public."characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX characters_active_idx ON public.characters USING btree (campaign_id, is_active);

CREATE INDEX characters_campaign_idx ON public.characters USING btree (campaign_id);

CREATE INDEX characters_user_idx ON public.characters USING btree (user_id);

CREATE INDEX idx_characters_campaign_id ON public.characters USING btree (campaign_id);

CREATE INDEX idx_characters_user_id ON public.characters USING btree (user_id);

ALTER TABLE public."characters" ENABLE ROW LEVEL SECURITY;

GRANT select ON public."characters" TO "anon";

GRANT select, insert, update, delete ON public."characters" TO "authenticated";

GRANT select, insert, update, delete, truncate ON public."characters" TO "service_role";

ALTER TABLE public."scenes" ADD CONSTRAINT "scenes_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

CREATE INDEX idx_scenes_campaign_id ON public.scenes USING btree (campaign_id);

CREATE INDEX scenes_active_idx ON public.scenes USING btree (campaign_id, is_active);

CREATE INDEX scenes_campaign_idx ON public.scenes USING btree (campaign_id);

CREATE UNIQUE INDEX scenes_one_active_per_campaign ON public.scenes USING btree (campaign_id) WHERE (is_active = true);

ALTER TABLE public."scenes" ENABLE ROW LEVEL SECURITY;

GRANT select ON public."scenes" TO "anon";

GRANT select, insert, update, delete ON public."scenes" TO "authenticated";

GRANT select, insert, update, delete, truncate ON public."scenes" TO "service_role";

ALTER TABLE public."token_owners" ADD CONSTRAINT "token_owners_added_by_fkey" FOREIGN KEY (added_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."token_owners" ADD CONSTRAINT "token_owners_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE public."token_owners" ADD CONSTRAINT "token_owners_token_id_fkey" FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

ALTER TABLE public."token_owners" ADD CONSTRAINT "token_owners_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX idx_token_owners_campaign_id ON public.token_owners USING btree (campaign_id);

CREATE INDEX idx_token_owners_user_id ON public.token_owners USING btree (user_id);

ALTER TABLE public."token_owners" ENABLE ROW LEVEL SECURITY;

GRANT select ON public."token_owners" TO "anon";

GRANT select, insert, update, delete ON public."token_owners" TO "authenticated";

GRANT select, insert, update, delete, truncate ON public."token_owners" TO "service_role";

ALTER TABLE public."tokens" ADD CONSTRAINT "tokens_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE public."tokens" ADD CONSTRAINT "tokens_character_id_fkey" FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL;

ALTER TABLE public."tokens" ADD CONSTRAINT "tokens_entity_id_fkey" FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL;

ALTER TABLE public."tokens" ADD CONSTRAINT "tokens_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."tokens" ADD CONSTRAINT "tokens_scene_id_fkey" FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE;

CREATE INDEX idx_tokens_campaign_id ON public.tokens USING btree (campaign_id);

CREATE INDEX idx_tokens_scene_id ON public.tokens USING btree (scene_id);

CREATE INDEX tokens_campaign_idx ON public.tokens USING btree (campaign_id);

CREATE INDEX tokens_owner_idx ON public.tokens USING btree (owner_id);

CREATE INDEX tokens_scene_idx ON public.tokens USING btree (scene_id);

ALTER TABLE public."tokens" ENABLE ROW LEVEL SECURITY;

GRANT select ON public."tokens" TO "anon";

GRANT select, insert, update, delete ON public."tokens" TO "authenticated";

GRANT select, insert, update, delete, truncate ON public."tokens" TO "service_role";

CREATE OR REPLACE FUNCTION public.is_campaign_dm(campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select exists (
select 1 from public.campaigns
where id = campaign_id
and owner_id = auth.uid()
);
$function$;

CREATE OR REPLACE FUNCTION public.user_campaign_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select campaign_id from public.campaign_members where user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.user_dm_campaign_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select id from public.campaigns where owner_id = auth.uid();
$function$;

CREATE POLICY "DM can add members" ON public."campaign_members" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (is_campaign_dm(campaign_id));

CREATE POLICY "DM can remove members" ON public."campaign_members" AS PERMISSIVE FOR DELETE TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "DM sees all members" ON public."campaign_members" AS PERMISSIVE FOR SELECT TO "public" USING ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.owner_id = auth.uid()))));

CREATE POLICY "Members see own memberships" ON public."campaign_members" AS PERMISSIVE FOR SELECT TO "public" USING ((user_id = auth.uid()));

CREATE POLICY "Anyone can create campaign" ON public."campaigns" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "Members see campaigns they belong to" ON public."campaigns" AS PERMISSIVE FOR SELECT TO "public" USING ((id IN ( SELECT user_campaign_ids() AS user_campaign_ids)));

CREATE POLICY "Owners can delete own campaigns" ON public."campaigns" AS PERMISSIVE FOR DELETE TO "public" USING ((auth.uid() = owner_id));

CREATE POLICY "Owners can update own campaigns" ON public."campaigns" AS PERMISSIVE FOR UPDATE TO "public" USING ((auth.uid() = owner_id));

CREATE POLICY "Owners see own campaigns" ON public."campaigns" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = owner_id));

CREATE POLICY "DM deletes characters in campaign" ON public."characters" AS PERMISSIVE FOR DELETE TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "DM sees all characters in campaign" ON public."characters" AS PERMISSIVE FOR SELECT TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "DM updates characters in campaign" ON public."characters" AS PERMISSIVE FOR UPDATE TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "Party members see visible characters" ON public."characters" AS PERMISSIVE FOR SELECT TO "public" USING (((is_visible_to_party = true) AND (campaign_id IN ( SELECT user_campaign_ids() AS user_campaign_ids))));

CREATE POLICY "Player creates own character" ON public."characters" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((user_id = auth.uid()) AND (campaign_id IN ( SELECT user_campaign_ids() AS user_campaign_ids))));

CREATE POLICY "Player deletes own character" ON public."characters" AS PERMISSIVE FOR DELETE TO "public" USING ((user_id = auth.uid()));

CREATE POLICY "Player sees own character" ON public."characters" AS PERMISSIVE FOR SELECT TO "public" USING ((user_id = auth.uid()));

CREATE POLICY "Player updates own character" ON public."characters" AS PERMISSIVE FOR UPDATE TO "public" USING ((user_id = auth.uid()));

CREATE POLICY "DM creates scenes" ON public."scenes" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (is_campaign_dm(campaign_id));

CREATE POLICY "DM deletes scenes" ON public."scenes" AS PERMISSIVE FOR DELETE TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "DM sees all scenes" ON public."scenes" AS PERMISSIVE FOR SELECT TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "DM updates scenes" ON public."scenes" AS PERMISSIVE FOR UPDATE TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "Players see active scene" ON public."scenes" AS PERMISSIVE FOR SELECT TO "public" USING ((((is_active = true) OR (is_active = false)) AND (campaign_id IN ( SELECT user_campaign_ids() AS user_campaign_ids))));

CREATE POLICY "token_owners_delete_dm" ON public."token_owners" AS PERMISSIVE FOR DELETE TO "public" USING (is_campaign_dm(campaign_id));

CREATE POLICY "token_owners_insert_dm" ON public."token_owners" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (is_campaign_dm(campaign_id));

CREATE POLICY "token_owners_select_members" ON public."token_owners" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM campaign_members cm
  WHERE ((cm.campaign_id = token_owners.campaign_id) AND (cm.user_id = auth.uid())))));

CREATE POLICY "DM creates tokens" ON public."tokens" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((scene_id IN ( SELECT s.id
   FROM (scenes s
     JOIN campaigns c ON ((c.id = s.campaign_id)))
  WHERE (c.owner_id = auth.uid()))));

CREATE POLICY "DM updates tokens" ON public."tokens" AS PERMISSIVE FOR UPDATE TO "public" USING ((campaign_id IN ( SELECT user_dm_campaign_ids() AS user_dm_campaign_ids)));

CREATE POLICY "Delete tokens" ON public."tokens" AS PERMISSIVE FOR DELETE TO "public" USING (((owner_id = auth.uid()) OR (scene_id IN ( SELECT s.id
   FROM (scenes s
     JOIN campaigns c ON ((c.id = s.campaign_id)))
  WHERE (c.owner_id = auth.uid())))));

CREATE POLICY "Members see tokens" ON public."tokens" AS PERMISSIVE FOR SELECT TO "public" USING ((campaign_id IN ( SELECT user_campaign_ids() AS user_campaign_ids)));

CREATE POLICY "Players update own tokens" ON public."tokens" AS PERMISSIVE FOR UPDATE TO "public" USING ((owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
new.updated_at = now();
return new;
end;
$function$;

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
insert into public.campaign_members (campaign_id, user_id, role)
values (new.id, new.owner_id, 'dm');
return new;
end;
$function$;

CREATE TRIGGER on_campaign_created AFTER INSERT ON public.campaigns FOR EACH ROW EXECUTE FUNCTION handle_new_campaign();

CREATE TRIGGER characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER scenes_updated_at BEFORE UPDATE ON public.scenes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION public.broadcast_token_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
begin
perform realtime.broadcast_changes(
'token-owners:' || coalesce(new.campaign_id, old.campaign_id)::text,
tg_op,
tg_op,
tg_table_name,
tg_table_schema,
new,
old
);
return coalesce(new, old);
end;
$function$;

CREATE TRIGGER token_owners_broadcast AFTER INSERT OR DELETE ON public.token_owners FOR EACH ROW EXECUTE FUNCTION broadcast_token_owners();

CREATE OR REPLACE FUNCTION public.broadcast_token_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
begin
perform realtime.broadcast_changes(
'tokens:' || coalesce(new.scene_id, old.scene_id)::text,
TG_OP,
TG_OP,
TG_TABLE_NAME,
TG_TABLE_SCHEMA,
NEW,
OLD
);
return coalesce(new, old);
end;
$function$;

CREATE TRIGGER tokens_broadcast_trigger AFTER INSERT OR DELETE OR UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION broadcast_token_changes();

CREATE TRIGGER tokens_updated_at BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION hp_lab.captured_apply_token_hp(p_token_id uuid, p_scene_id uuid, p_amount integer, p_mode text, p_expected_hp integer DEFAULT NULL::integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
v_user uuid := auth.uid();
v_token public.tokens%ROWTYPE;
v_char public.characters%ROWTYPE;
v_new integer;
v_char_hp jsonb;
v_hp_max integer;
v_current integer;
BEGIN
IF v_user IS NULL THEN
RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
END IF;
IF p_token_id IS NULL OR p_scene_id IS NULL OR p_amount IS NULL
OR p_amount < 0 OR p_amount > 1000000
OR p_mode IS NULL OR p_mode NOT IN ('damage', 'heal', 'set') THEN
RAISE EXCEPTION 'Invalid HP request' USING ERRCODE = '22023';
END IF;

-- Hold the token row lock across computation and both writes.
SELECT t.* INTO v_token
FROM public.tokens t
JOIN public.scenes s ON s.id = t.scene_id AND s.campaign_id = t.campaign_id
WHERE t.id = p_token_id AND t.scene_id = p_scene_id
FOR UPDATE OF t;
IF NOT FOUND THEN
RAISE EXCEPTION 'Token not found' USING ERRCODE = 'P0002';
END IF;

-- Explicit permissions required under SECURITY DEFINER.
IF NOT EXISTS (
SELECT 1 FROM public.campaign_members m
WHERE m.campaign_id = v_token.campaign_id AND m.user_id = v_user
AND (
(m.role = 'dm' AND EXISTS (
SELECT 1 FROM public.campaigns cp
WHERE cp.id = v_token.campaign_id AND cp.owner_id = v_user
))
OR v_token.owner_id = v_user
OR EXISTS (
SELECT 1 FROM public.token_owners o
WHERE o.token_id = v_token.id
AND o.campaign_id = v_token.campaign_id
AND o.user_id = v_user
)
)
) THEN
RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
END IF;

IF v_token.hp_current IS NULL OR v_token.hp_max IS NULL
OR v_token.hp_max <= 0 OR v_token.hp_current < 0
OR v_token.hp_current > v_token.hp_max THEN
RAISE EXCEPTION 'Invalid token HP' USING ERRCODE = '22023';
END IF;
IF p_expected_hp IS NOT NULL AND (p_expected_hp < 0 OR p_expected_hp > v_token.hp_max) THEN
RAISE EXCEPTION 'Invalid expected HP' USING ERRCODE = '22023';
END IF;
IF p_mode = 'set' AND p_expected_hp IS NULL THEN
RAISE EXCEPTION 'Setting HP requires expected current HP' USING ERRCODE = '22023';
END IF;
IF p_expected_hp IS NOT NULL AND v_token.hp_current <> p_expected_hp THEN
RAISE EXCEPTION 'HP changed; retry' USING ERRCODE = '40001';
END IF;

IF v_token.character_id IS NOT NULL THEN
SELECT c.* INTO v_char FROM public.characters c
WHERE c.id = v_token.character_id AND c.campaign_id = v_token.campaign_id
FOR UPDATE;
IF NOT FOUND THEN
RAISE EXCEPTION 'Linked character not found' USING ERRCODE = 'P0002';
END IF;

v_char_hp := v_char.data_json -> 'hp';
-- Require integral JSON numbers, not coercion of malformed strings.
IF jsonb_typeof(v_char_hp) <> 'object'
OR jsonb_typeof(v_char_hp -> 'current') <> 'number'
OR jsonb_typeof(v_char_hp -> 'max') <> 'number'
OR (v_char_hp ->> 'current') !~ '^[0-9]+$'
OR (v_char_hp ->> 'max') !~ '^[0-9]+$' THEN
RAISE EXCEPTION 'Invalid linked character HP' USING ERRCODE = '22023';
END IF;
IF length(v_char_hp ->> 'current') > 10 OR length(v_char_hp ->> 'max') > 10 THEN
RAISE EXCEPTION 'Linked character HP out of integer range' USING ERRCODE = '22023';
END IF;
-- Even ten digits may exceed int4; validate numeric range before casting.
IF (v_char_hp ->> 'current')::numeric > 2147483647
OR (v_char_hp ->> 'max')::numeric > 2147483647 THEN
RAISE EXCEPTION 'Linked character HP out of integer range' USING ERRCODE = '22023';
END IF;
v_current := (v_char_hp ->> 'current')::integer;
v_hp_max := (v_char_hp ->> 'max')::integer;
IF v_hp_max <= 0 OR v_current < 0 OR v_current > v_hp_max
OR v_hp_max <> v_token.hp_max OR v_current <> v_token.hp_current THEN
RAISE EXCEPTION 'Token and character HP disagree' USING ERRCODE = '22023';
END IF;
END IF;

IF p_mode = 'damage' THEN
v_new := GREATEST(0, v_token.hp_current - p_amount);
ELSIF p_mode = 'heal' THEN
v_new := LEAST(v_token.hp_max, v_token.hp_current::bigint + p_amount)::integer;
ELSE
v_new := LEAST(v_token.hp_max, p_amount);
END IF;

-- Locking both rows guarantees consistency only among writers that use this RPC.
-- Fail closed on a partial update rather than falsely reporting success.
UPDATE public.tokens SET hp_current = v_new WHERE id = v_token.id;
IF NOT FOUND THEN
RAISE EXCEPTION 'Token disappeared during HP update' USING ERRCODE = 'P0002';
END IF;
IF v_token.character_id IS NOT NULL THEN
UPDATE public.characters
SET data_json = jsonb_set(data_json, '{hp,current}', to_jsonb(v_new), false)
WHERE id = v_char.id;
IF NOT FOUND THEN
RAISE EXCEPTION 'Linked character disappeared during HP update' USING ERRCODE = 'P0002';
END IF;
END IF;
RETURN v_new;
END;
$function$;

REVOKE ALL ON FUNCTION hp_lab.captured_apply_token_hp(uuid,uuid,integer,text,integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION hp_lab.captured_apply_token_hp(uuid,uuid,integer,text,integer) TO "authenticated";

CREATE OR REPLACE FUNCTION hp_lab.captured_update_character_data_cas(p_character_id uuid, p_campaign_id uuid, p_expected jsonb, p_next jsonb)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
begin
if (select auth.uid()) is null then return false; end if;
if p_expected is null or p_next is null or jsonb_typeof(p_expected)<>'object' or jsonb_typeof(p_next)<>'object' or length(p_next::text)>200000 then
raise exception 'Invalid character data' using errcode='22023';
end if;
update public.characters set data_json=p_next where id=p_character_id and campaign_id=p_campaign_id and data_json=p_expected;
return found;
end;
$function$;

REVOKE ALL ON FUNCTION hp_lab.captured_update_character_data_cas(uuid,uuid,jsonb,jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION hp_lab.captured_update_character_data_cas(uuid,uuid,jsonb,jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION hp_lab.captured_update_character_data_cas(uuid,uuid,jsonb,jsonb) TO "authenticated";

CREATE OR REPLACE FUNCTION hp_lab.captured_update_character_identity_atomic(p_character_id uuid, p_campaign_id uuid, p_class text, p_subclass text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
declare
v_class text;
v_expected text;
begin
if (select auth.uid()) is null then return false; end if;
v_class := regexp_replace(p_class, '^srd-2024_', '');
if v_class is null or v_class not in ('barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard') then
raise exception 'Invalid base class' using errcode = '22023';
end if;
if p_subclass is not null then
v_expected := case p_subclass
when 'srd-2024_path-of-the-berserker' then 'barbarian'
when 'srd-2024_college-of-lore' then 'bard'
when 'srd-2024_life-domain' then 'cleric'
when 'srd-2024_circle-of-the-land' then 'druid'
when 'srd-2024_champion' then 'fighter'
when 'srd-2024_warrior-of-the-open-hand' then 'monk'
when 'srd-2024_oath-of-devotion' then 'paladin'
when 'srd-2024_hunter' then 'ranger'
when 'srd-2024_thief' then 'rogue'
when 'srd-2024_draconic-sorcery' then 'sorcerer'
when 'srd-2024_fiend-patron' then 'warlock'
when 'srd-2024_evoker' then 'wizard'
else null end;
if v_expected is distinct from v_class then
raise exception 'Subclass does not match base class' using errcode = '22023';
end if;
end if;
update public.characters
set data_json = case when p_subclass is null
then jsonb_set(coalesce(data_json, '{}'::jsonb) - 'subclass', '{class}', to_jsonb(v_class), true)
else jsonb_set(jsonb_set(coalesce(data_json, '{}'::jsonb), '{class}', to_jsonb(v_class), true), '{subclass}', to_jsonb(p_subclass), true)
end
where id = p_character_id and campaign_id = p_campaign_id;
return found;
end;
$function$;

REVOKE ALL ON FUNCTION hp_lab.captured_update_character_identity_atomic(uuid,uuid,text,text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION hp_lab.captured_update_character_identity_atomic(uuid,uuid,text,text) TO "service_role";

GRANT EXECUTE ON FUNCTION hp_lab.captured_update_character_identity_atomic(uuid,uuid,text,text) TO "authenticated";

RESET ROLE;
