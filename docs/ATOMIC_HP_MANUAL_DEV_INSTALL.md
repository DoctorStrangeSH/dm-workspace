# Atomic HP — approved manual DEV deployment

**Environment:** Supabase project `dm-workspace` (ref `yoondivyeueyrtgeldja`) ONLY.
**Excluded:** `dm-workspace-prod` (ref `klzziumdjpagqquihpks`).

The reviewed SQL is at `docs/sql/apply_token_hp_atomic.REVIEW.sql`. It has NOT been deployed by this PR. The connected deployment attempt was blocked; do not bypass the block.

## Manual handoff
1. Open Supabase Dashboard and visually confirm project name and ref are `dm-workspace` / `yoondivyeueyrtgeldja`.
2. Review the complete SQL, especially `SECURITY DEFINER`, role grants, membership and token ownership checks, before manual execution.
3. Confirm that fixture campaign, scene, test account, token and linked character are disposable and isolated. Do not select existing game entities.
4. If approved, execute the reviewed SQL in DEV SQL Editor through the user's own authorized workflow. This is a schema modification; make a backup and record the migration version first.
5. Verify `pg_proc` function existence and effective anon/authenticated execute grants. Confirm no anonymous EXECUTE.
6. Enable the gated RPC only in an isolated DEV deployment (not production) and run `scripts/test-atomic-hp-dev.ts` with the explicit marked fixture campaign.
7. Validate concurrent damage/heal, stale set, permission isolation, linked character consistency and live broadcasts. Leave the feature flag disabled until all tests pass.
8. Keep a rollback plan and compare recorded changes. Production requires separate permission and independent rollout.

## Caveats
- The SQL remains review-only and may require changes following a security review.
- The existing app still has legacy character writers that must be coordinated before release.
- A successful TypeScript CI run is not evidence of Postgres concurrency correctness.
