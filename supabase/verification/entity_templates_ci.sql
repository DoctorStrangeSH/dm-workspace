-- ONLY the disposable CI PostgreSQL service, after pr37_ci_assertions.sql.
-- The outer rollback also removes all test-only campaigns, policies and templates.
BEGIN;
CREATE TABLE public.campaigns (id uuid PRIMARY KEY);
INSERT INTO public.campaigns VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
CREATE FUNCTION public.is_campaign_dm(campaign_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS (SELECT 1 FROM public.campaign_members m
   WHERE m.campaign_id=is_campaign_dm.campaign_id AND m.user_id=auth.uid() AND m.role='dm')
$$;
\ir ../migrations/20261113125548_entity_templates.sql

INSERT INTO public.entity_templates(id,campaign_id,type,name,is_builtin) VALUES
 ('10000000-0000-4000-8000-000000000001',NULL,'npc','Builtin',true),
 ('10000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','npc','Secret A',false),
 ('10000000-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','npc','Secret B',false);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM public.entity_templates;
 IF n<>2 THEN RAISE EXCEPTION 'DM must see builtin and own template only'; END IF;
 INSERT INTO public.entity_templates(campaign_id,type,name,data_json)
 VALUES ('11111111-1111-4111-8111-111111111111','quest','DM snapshot','{"goal":"test"}');
 DELETE FROM public.entity_templates WHERE name='DM snapshot';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Own custom template deletion failed'; END IF;
 DELETE FROM public.entity_templates WHERE name IN ('Builtin','Secret B');
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Builtin or other campaign deleted'; END IF;
 BEGIN
  INSERT INTO public.entity_templates(campaign_id,type,name)
  VALUES ('22222222-2222-4222-8222-222222222222','npc','Foreign');
  RAISE EXCEPTION 'Foreign insert allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.entity_templates(type,name,is_builtin) VALUES ('npc','Forged builtin',true);
  RAISE EXCEPTION 'Builtin insert allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.entity_templates SET campaign_id='22222222-2222-4222-8222-222222222222';
  RAISE EXCEPTION 'Client UPDATE allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.entity_templates(campaign_id,type,name,data_json)
  VALUES ('11111111-1111-4111-8111-111111111111','npc','Bad JSON','[]');
  RAISE EXCEPTION 'Array payload allowed';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.entity_templates(campaign_id,type,name)
  VALUES ('11111111-1111-4111-8111-111111111111','invalid','Bad type');
  RAISE EXCEPTION 'Invalid entity type allowed';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

-- Player in A, DM in B, and outsider: none may read A's custom template.
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.entity_templates)<>1 THEN RAISE EXCEPTION 'Player template leak'; END IF;
 BEGIN
  INSERT INTO public.entity_templates(campaign_id,type,name)
  VALUES ('11111111-1111-4111-8111-111111111111','npc','Player write');
  RAISE EXCEPTION 'Player insert allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.entity_templates)<>2 OR
    EXISTS(SELECT 1 FROM public.entity_templates WHERE name='Secret A')
 THEN RAISE EXCEPTION 'Other DM scope leak'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.entity_templates)<>1 THEN RAISE EXCEPTION 'Outsider template leak'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM 1 FROM public.entity_templates;
  RAISE EXCEPTION 'Anonymous template access allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.entity_templates'::regclass)
 THEN RAISE EXCEPTION 'RLS disabled'; END IF;
 DELETE FROM public.campaigns WHERE id='11111111-1111-4111-8111-111111111111';
 IF EXISTS(SELECT 1 FROM public.entity_templates WHERE name='Secret A')
 THEN RAISE EXCEPTION 'Campaign template orphan'; END IF;
 IF (SELECT count(*) FROM public.entity_templates)<>2 THEN RAISE EXCEPTION 'Cascade escaped campaign'; END IF;
END $$;
ROLLBACK;
\echo 'PASS: entity template DM isolation, insert/delete, builtin protection, UPDATE/anon denial, payload checks and cascade'
