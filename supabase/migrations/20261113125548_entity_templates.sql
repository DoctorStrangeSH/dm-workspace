-- Additive migration. Fail on existing-table drift rather than silently accepting it.
CREATE TABLE public.entity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('npc','location','item','monster','faction','quest','note')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100 AND char_length(btrim(name)) > 0),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 5000),
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data_json) = 'object'),
  icon text,
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entity_templates_scope CHECK (
    (is_builtin AND campaign_id IS NULL) OR (NOT is_builtin AND campaign_id IS NOT NULL)
  )
);
CREATE INDEX entity_templates_campaign_type_name_idx
  ON public.entity_templates(campaign_id, type, name);

ALTER TABLE public.entity_templates ENABLE ROW LEVEL SECURITY;
-- Remove permissive Supabase default grants before exposing the new table.
REVOKE ALL ON public.entity_templates FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.entity_templates TO authenticated;

CREATE POLICY entity_templates_read ON public.entity_templates
  FOR SELECT TO authenticated
  USING (is_builtin OR public.is_campaign_dm(campaign_id));
CREATE POLICY entity_templates_create ON public.entity_templates
  FOR INSERT TO authenticated
  WITH CHECK (NOT is_builtin AND campaign_id IS NOT NULL AND public.is_campaign_dm(campaign_id));
CREATE POLICY entity_templates_delete ON public.entity_templates
  FOR DELETE TO authenticated
  USING (NOT is_builtin AND public.is_campaign_dm(campaign_id));

COMMENT ON TABLE public.entity_templates IS
  'Reusable entity snapshots. Campaign templates are DM-only; builtins are admin-managed. No client UPDATE grant.';
