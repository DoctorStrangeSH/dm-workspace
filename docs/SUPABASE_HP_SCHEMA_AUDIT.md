# Supabase schema / RLS audit — 2026-10-26

## Read-only provenance
Connected Supabase account offers two relevant, distinct projects:
- `dm-workspace` (project ref `yoondivyeueyrtgeldja`) — **inspected read-only**
- `dm-workspace-prod` (project ref `klzziumdjpagqquihpks`) — **not queried**

Project names alone are NOT sufficient proof that `dm-workspace` is safely isolated DEV. **No mutation or migration was performed.**

## Verified schema in inspected project
- `public.tokens`: uuid `id`, `scene_id`, `campaign_id`, nullable uuid `character_id`/`owner_id`, nullable integer `hp_current`/`hp_max`; RLS enabled.
- `public.characters`: uuid `id`, `campaign_id`, `user_id`, non-null `data_json jsonb`; RLS enabled.
- `public.campaign_members.role` is enum `campaign_role` with values `dm`, `player`; RLS enabled.
- `public.token_owners` has `token_id`, `user_id`, `campaign_id`; RLS enabled.
- `public.scenes` has uuid `id`, `campaign_id`; RLS enabled.

## Verified relevant policies (read-only pg_policies)
- Tokens SELECT: campaign membership via `user_campaign_ids()`.
- Tokens UPDATE: primary `owner_id = auth.uid()` **or** a DM campaign via `user_dm_campaign_ids()`; no policy identified explicitly granting UPDATE to additional `token_owners`.
- Characters UPDATE: character `user_id = auth.uid()` or `is_campaign_dm(campaign_id)`.
- Token owners SELECT: campaign members; grant/revoke through DM rules.
- Campaign membership SELECT: own membership or campaign owner visibility; `is_campaign_dm()` helper appears in multiple policies.

## Implications for PR #73 SQL prototype
1. The proposed function uses `SECURITY DEFINER`. This should receive an independent privilege/bypass-RLS audit. Prefer a non-exposed private helper and narrow authenticated wrapper if needed; ensure functions are not accessible to anonymous callers. Never assume app-level permission checks suffice.
2. The function's own membership + token ownership checks match desired UI semantics better than direct UPDATE RLS for added owners, but role and helper function security must be reviewed.
3. The prototype assumes character and token HP maxima agree. Test whether this holds for historical campaigns before activation.
4. The function updates `characters.data_json` with `jsonb_set`, avoiding wholesale replacement. All existing HP write paths still require coordinated integration.
5. For real atomicity, no direct competing HP write path may bypass the RPC. Required audit includes `updateTokenHP`, `damageToken`, HP tracker actions and any other character HP updates.
6. Existing draft remains in `docs/sql`, not migration directory. Do not install on inspected project until DEV isolation is explicitly verified.

## Gate before next phase
Identify environment ownership and which Vercel deployments use each Supabase ref without disclosing credentials. Then review SQL privileges and test on a confirmed isolated database, followed by separate deployable migration and app integration PRs.

No user data rows were retrieved or modified; metadata only.
