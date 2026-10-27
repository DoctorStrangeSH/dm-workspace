# HANDOFF — PR #37 Realtime + private Storage security

## CRITICAL LIVE DEV BUGFIX — 2026-10-27

A **real DEV PostgreSQL RLS impersonation test** found a bug in the fourth migration's scene-map Storage SELECT policy: `storage.foldername(name)` inside a join of `public.scenes s` resolved `name` to `s.name`, NOT to `storage.objects.name`. As a result, an authorized GM could read the scene row but was denied its Storage object (observed count **0**).

**FIXED IN LIVE DEV.** Added `supabase/migrations/20261027000500_fix_private_scene_maps_object_name.sql`, applied successfully to DEV with migration history name `pr37_fix_private_scene_maps_object_name`. New policy explicitly uses `storage.foldername(storage.objects.name)`. Same impersonation query after fix shows GM can see the linked scene-map object (**1**). The fixture schema was updated to include `scenes.name` so the regression is tested in CI; CI workflow now applies the fifth migration.

Read-only role-impersonation test (using `SET LOCAL ROLE authenticated/anon` and transaction `ROLLBACK`; no fixtures or data changed) also confirmed player music access **1**, outsider music/maps/handouts **0**, anonymous private objects **0**. A user without authorization sees nothing. Real Supabase Storage HTTP/signed URLs and WebSocket subscriptions are still NOT tested; do not merge or modify PROD until application compatibility is confirmed.

**Production still has old publicly readable buckets/policies and has not been changed.**

---

## IMPORTANT LIVE UPDATE — 2026-10-27: DEV migrations APPLIED

**The prior statements below that DEV has public buckets / broad Realtime SELECT / no migrations are HISTORICAL and NO LONGER TRUE.** This update supersedes them. Do not apply PR #37 migrations a second time to DEV.

The user explicitly authorized overwriting DEV, and all four staged migrations were applied **successfully** using Supabase `apply_migration` to project `yoondivyeueyrtgeldja`, in this order:

1. `pr37_realtime_broadcast_authorization`
2. `pr37_private_handout_storage`
3. `pr37_private_music_storage`
4. `pr37_private_scene_maps_storage`

**Before executing migrations**, the exact pre-change function definitions, relevant policy definitions and bucket public flags were committed to `supabase/verification/pr37_dev_pre_migration_snapshot.json` (commit `23b3fcc`). This is a *metadata-only recovery snapshot, NOT a complete restorable database backup*.

**Read-only verification AFTER the actual DEV migration:**
- `handouts`, `music`, `scene-maps` in `storage.buckets` are all `public=false`.
- `realtime.messages` SELECT policy is now `Campaign members can receive scoped broadcasts`; old unrestricted `Authenticated can receive broadcasts` is gone.
- Broad public Storage SELECT policies on those three buckets are gone; member-scoped SELECT, DM upload and DM delete policies exist.
- All eight audited `public.broadcast_*` functions show `search_path=pg_catalog`.
- Migration history contains the four entries above.
- DEV data counts at verification: 6 campaign membership rows, 0 handouts, 1 track, 4 scenes, 1 music Storage object and 3 scene-map Storage objects. **This limits handout end-to-end verification: no real handouts existed.**
- **PRODUCTION `klzziumdjpagqquihpks` was not touched.**

**Read-only PROD preflight (2026-10-27):** PROD `klzziumdjpagqquihpks` still has all three targeted buckets `public=true`, public Storage SELECT policies, the unrestricted `Authenticated can receive broadcasts` Realtime policy and 4 campaign membership rows. PROD was not modified. Do not apply production SQL before deployment compatibility/runtime validation.

**Post-DEV security advisor:** Supabase reports unrelated mutable-search-path warnings for five legacy functions and SECURITY DEFINER callable-role warnings (including broadcast triggers). No blanket privilege revocation was performed; investigate separately and test trigger behavior before modifying grants.

**STILL REQUIRED BEFORE PROD/merge:** Test actual DEV browser/API Storage reads and redirects (scene map and music objects available), Realtime WebSocket auth and role isolation using real users, and confirm DEV app deployment matches PR branch; a real recoverable backup is not yet confirmed. The user gave permission to eventually move changes to PROD, but production must remain untouched until these checks pass and application deployment is coordinated. No new paid branch created.

---


**Updated 2026-10-27. READ THIS FIRST IN THE NEXT AI SESSION. Do not redo completed stages.**

Repository: `DoctorStrangeSH/dm-workspace`.
PR: https://github.com/DoctorStrangeSH/dm-workspace/pull/37
Branch: `security/realtime-storage-hardening-plan`.
Verified HEAD before this handoff commit: `027c5d0bc6a50284d4e037c3b3ead2b214203eb6`.
**Keep PR Draft/open. No changes to DEV or PROD until the runtime release gate is cleared.**
The user wants to finish PR #37 and return to D&D website features, **not** add endless speculative checklists or repeat green checks.

## What has ALREADY been done (do not repeat)

1. Security implementation in PR #37: four staged migrations
   - `supabase/migrations/20261027000100_realtime_broadcast_authorization.sql`
   - `supabase/migrations/20261027000200_private_handout_storage.sql`
   - `supabase/migrations/20261027000300_private_music_storage.sql`
   - `supabase/migrations/20261027000400_private_scene_maps_storage.sql`
2. Realtime hooks converted to private channels, scoped member/DM topics. The player topic `handouts-visible:<campaignId>` receives only `id, campaign_id, name, is_visible` (not `image_url`). `src/lib/realtime/visible-handout.ts` validates this DTO, with behavior tests in `tests/visible-handout.test.ts`.
3. Signed URL routes for private handouts, music, scene maps are in `src/app/api`.
4. PR branch merged up to main at merge commit `fc69eb7`; GitHub confirmed `mergeable=true`, no conflicts (but don't confuse this with safe to deploy).
5. GitHub CI includes PR #37 static checks, Node DTO tests, lint, typecheck, Next production build.
6. **Most important evidence:** isolated PostgreSQL 17 job in `.github/workflows/ci.yml` builds fixture `supabase/verification/pr37_ci_fixture.sql`, applies all four *actual* staged SQL files, runs role/isolation/lifecycle assertions `supabase/verification/pr37_ci_assertions.sql`. Run **40537742518**, also run **40537730092**, were green on `027c5d0`. Link: https://github.com/DoctorStrangeSH/dm-workspace/actions/runs/40537742518 . SQL job passed; lint/types/build passed. THIS IS REAL POSTGRES SQL/RLS execution, not a real Supabase API/WebSocket integration.
7. Prior Vercel build-rate-limit sometimes flips between success and failure; it is external. Do not interpret this as a SQL defect. Prior preview succeeded on `fc69eb7` but latest preview is NOT verified.
8. Verification SQL `supabase/verification/pr_37_readiness.sql` and staging matrix `docs/security/pr-37-staging-test-matrix.md` exist. More frequent PR comments have been left; avoid more redundant comments.

## Cloud environments — crucial separation

Supabase **DEV** project id `yoondivyeueyrtgeldja` (dm-workspace).
Supabase **PROD** project id `klzziumdjpagqquihpks` (dm-workspace-prod).
DO NOT run these PR migrations on PROD. DO NOT blindly apply them on DEV without a test/rollback window and backup.
As of 2026-10-27, DEV:
- `storage.buckets` entries `handouts`, `music`, `scene-maps` are public; broad Storage `Anyone can view ...` SELECT policies still present.
- `realtime.messages` policy `Authenticated can receive broadcasts` has `USING (true)`.
- DB `broadcast_*` SECURITY DEFINER functions are live old versions until migration.
- Supabase migration history list is **empty**; do not assume clean local `supabase db reset` reconstructs actual DEV database.
- Supabase branching list was empty. Branch creation may incur charges; ask/obtain tool cost confirmation before creating anything billable. No new cloud project has been created.

## Exact remaining release blockers

**NOT DONE:** applying migrations to a *real Supabase runtime* and verifying (with authenticated test users) Storage REST/signed URL access, server routes and WebSocket private-channel subscriptions/payloads, DM vs member vs outsider vs anonymous, and cross-campaign denial. PostgreSQL fixture is minimal/synthetic and mocks `realtime.send` and `broadcast_changes`; it cannot prove WebSocket, Storage API, redirect playback, auth cookies or Supabase service integration.

**PREPARED, NOT YET VERIFIED:** `docs/security/PR37_DEV_RELEASE_AND_RECOVERY.md` now documents safe DEV staged validation, pre-change snapshots and fail-closed recovery. **STILL NOT DONE:** capture a tested restore/rollback path and actual DEV backup before changing policies. Suggested safe rollback preparation: record exact pre-migration policy definitions, bucket flags, trigger function bodies/ownership/search_path, migration/test logs. Rollback of SELECT authorization must avoid temporarily exposing confidential private bytes; restoring `public=true` is a security regression, not a safe generic rollback. Choose safe staged rollout with application compatibility and per-migration verification. No cloud mutation has been authorized.

**NOT DONE:** test complete UI flows with signed route handout image/music audio/scene map, token-wall-fog-summon/chat and no client-originated Broadcast writes. Check token-owner UPDATE behavior in real triggers. Add only essential regression tests; do not start new cosmetic refactors.

**Potential item to inspect:** The Realtime migration still has stale commentary near `handouts:%` about the trigger publishing raw rows; actual trigger emits only `handouts-visible:%`. Clean up only if materially useful.

## How next AI should proceed, without loops

1. Read THIS file + latest PR/head CI; **do not** repeat completed lint/build or isolated PostgreSQL testing.
2. Determine whether a fully isolated, cost-approved Supabase branch/environment with a faithful DEV baseline and Auth+Storage+Realtime services can be used for **real runtime** verification. If available, run exact matrix and capture evidence; else state exact blocker instead of claiming complete.
3. Prepare executable, conservative DEV rollback/runbook with real snapshot and explicit order; do not expose buckets as a 'rollback'.
4. Only after real runtime and rollback pass, prepare PR for review/merge. Don't merge or deploy database changes merely because CI is green. If no real runtime available, leave Draft and report the *single* outstanding blocker; avoid repeating tasks already done.
5. When completed, update this handoff and PR once with run IDs/commit/tests so a later AI knows exactly what happened.

## User communication
Collaborative Russian, concise and warm. User is tired of repeating work and explicitly requested a thorough handoff for the next AI. Keep action-focused, evidence-backed; no promises of asynchronous/background work. No names or secrets.
