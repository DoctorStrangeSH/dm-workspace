# PR #37 — DEV-only release and recovery runbook

This is an **operator runbook, not proof of a completed rollout**.
PR branch: `security/realtime-storage-hardening-plan`. Read `PR37_HANDOFF_FOR_NEXT_AI.md` first.
**Never run these steps on PRODUCTION as part of PR #37.**
Database IDs: DEV `yoondivyeueyrtgeldja`; PROD `klzziumdjpagqquihpks`.

## Preconditions — stop if any is missing

1. Approved **DEV maintenance/test window** and an accountable operator.
2. Confirm tested Git commit equals PR HEAD and the compatible application is deployed to DEV.
3. A verified, restorable **DEV database backup/snapshot** with a documented recovery procedure (including Storage objects if changes affect files). A read-only SQL export is **not** a full backup.
4. Snapshot the **exact** policies and definitions, not assumptions from the repository:
   - `select * from pg_policies where (schemaname='realtime' and tablename='messages') or (schemaname='storage' and tablename='objects');`
   - `select id,name,public from storage.buckets where id in ('handouts','music','scene-maps');`
   - `select n.nspname,p.proname,pg_get_functiondef(p.oid),p.proconfig,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'broadcast_%';`
   - Save relevant `pg_trigger` definitions, grants, and applied migration history.
5. A fixture campaign with test **DM**, **player**, **other-campaign member**, **outsider**, **anonymous**, and disposable media objects. No production content or secrets in test logs.
6. Runtime test access to actual **Supabase Auth, Realtime WebSocket, Storage REST**, and the deployed Next.js application.
7. Confirm the browser client uses `private:true` subscriptions, authorized API signed-URL routes and refreshed Realtime auth. Confirm preview deployment is functioning; an unrelated Vercel rate limit means preview is unverified.

## Minimal staged rollout sequence (DEV only)

1. Run preflight read-only `supabase/verification/pr_37_readiness.sql`. Attach output to PR.
2. Validate the exact migration source against **DEV's actual schema** and trigger signatures, not only the synthetic CI fixture.
3. Apply `20261027000100_realtime_broadcast_authorization.sql` **only** in the approved DEV test window. Immediately verify Realtime subscriptions and publisher topics with DM/player/outsider/anon, client Broadcast spoof attempts, hidden handout visibility lifecycle, summons DM-only behavior, walls, fog, tokens, token owners, messages and music. Stop on regressions.
4. Ensure compatible image/audio/map routes are already live. Apply Storage migrations one-by-one: `...00200_private_handout_storage.sql`, `...00300_private_music_storage.sql`, `...00400_private_scene_maps_storage.sql`. After **each**, verify bucket privacy, no public SELECT policy, successful authorized and denied object reads/signed URLs, DM upload/delete, and UI media loading. Stop immediately on failures.
5. Test handout visibility toggle; concealed asset is denied; other campaign and anonymous access denied; stale original public URL is denied. Check audio Range behavior and expiry of signed URLs.
6. Record exact commit, migration output, actual observed role-specific results and links to evidence. Only after all gates pass, consider marking PR Ready for Review, then merging according to deployment order.

## Recovery: fail closed; do NOT automatically revert to public access

- If a private Storage bucket disrupts clients, **do not** flip `public=true` or restore broad `Anyone can view ...` read policies as an automatic fix. That would re-expose sensitive media. Prefer fixing/restoring the compatible application or denying reads temporarily.
- If Realtime channel authorization breaks, isolate and restore a tested policy **with equivalent campaign/role isolation**; do not simply recreate `USING (true)` as a recovery action.
- If an applied migration is incorrect, stop new deployments, keep affected access private, and restore from a verified snapshot or write an explicit corrective migration after reviewing the saved DEV policy/function definitions and dependency order. A SQL `ROLLBACK` only works for an open transaction **before** it was committed; each of the four migration files commits.
- If an incident requires a database restore, confirm backup includes dependent rows/object metadata and that Supabase Storage object bytes are separately accounted for. Follow actual platform restore instructions and reverify permissions.
- Remove/revoke disposable test users and test media after successful validation, preserving anonymized evidence of outcomes.
- **Do not extrapolate a synthetic GitHub PostgreSQL RLS green check to Supabase Storage REST or Realtime WebSocket behavior.**

## Release decision

PR stays Draft until actual DEV runtime role-isolation and recovery prerequisites are verified. Don't ship migrations on PROD in PR #37. The operator must explicitly authorize any environment changes.
