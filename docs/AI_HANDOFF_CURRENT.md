# DM Workspace — current AI handoff (2026-10-28)

Read repository AGENTS.md, [the owner's updated authorization](AI_PROJECT_AUTHORIZATION.md), then [the preserved backlog](PR_BACKLOG_TRIAGE_2026-10-28.md). Refresh live refs, PR states and deployment checks. A closed PR is not necessarily merged; passing defect-reproduction tests do not prove a fix.

## Integration checkpoint

- Repository: DoctorStrangeSH/dm-workspace. This integration starts from main 36e406442b10324d9cadf70c1c84ae53d7684e5a. #241 now includes the original reviewed heads of #238 (586d18c378721dc47b58769c64e6be3df46c0d2d), #239 (a23d8fb2396a99d92b90d6b6064ff29c726d702a) and #240 (4986bc4290f4e179a235930e45ffa119aba41d3d) through Git merge ancestry. Merge #241 using a merge commit, not squash, after combined checks pass; verify all four PRs' resulting states. This checkpoint describes the payload before release; consult GitHub for the final main SHA and merge receipt.
- The 84 older delivery PRs were closed without merge, their reviewed heads read back and all 84 source branches verified unchanged. [Closure receipts](verification/pr_archive_results_2026-10-28.json) record that completed snapshot. #237 was subsequently closed without merge at b0c475219f13fed8a8b88ef398bc31511596e058 because its findings are preserved in backlog B05. The five-PR inventory in the archive report is historical.
- Current app source has character/combat JSON CAS and identity-only validation, but HP writers remain uncoordinated. Token-only UPDATE, separate combat writes, stale siblings and unsafe level-up inputs are unresolved. Read HP_WRITE_PATH_AUDIT.md and HP_ATOMIC_ROLLOUT_CONTRACT.md. B01–B08 are unfinished work, not implemented fixes.
- #238 contributes a dry-run-by-default DEV harness and 32 offline mocked-request tests. The merged CI step runs only those offline tests. No manual live HP workflow is included, no sign-in is performed, and no live RPC is invoked by CI. Its CLI mutating mode still requires explicit opt-ins and durable fixture evidence; do not use it on the known-broken installed routine.
- #239 contributes HP_DEV_METADATA_RECONCILIATION.md and exact read-only inspection SQL. Historical catalog evidence includes missing-key SQL NULL validation, token-first/single-token locking, broad authorized direct writers and migration-effect drift. Raw local evidence is ../audit-evidence/hp-dev-2026-10-28/. Do not blindly replay migrations or repair ledger rows.
- #240 contributes HP_LOCAL_POSTGRES_BASELINE.md, tests/hp-postgres/README.md and an isolated PostgreSQL 17 test suite. The original head passed Windows/Linux/general CI/Vercel: 41 scenarios, 42 Node tests including parent (runs 40676897221/40676897244). The suite owns a new loopback-only cluster, accepts no remote DB URL, checks its identity and stops it. Role/UUID and Realtime shims do not establish live JWT/API/Realtime behavior. Missing HP keys, stale siblings, direct-writer bypass, unauthorized lock waits and stale token creation were reproduced; these remain defects.

## Authorization and release practice

The human owner now authorizes necessary Production releases and Supabase changes, PR merges and end-to-end improvements. See AI_PROJECT_AUTHORIZATION.md for the exact instruction. Earlier blanket prohibitions in audit reports are historical scope, not the latest owner preference. Do not ask again for routine covered steps. Technical readiness still requires review, environment/revision checks, suitable recovery, testing and outcome verification.

Publish only explicit feature refs with an expected-head/absent-branch lease; merge PRs with expected head SHA. Never write directly to main or use GitHub file mutation tools with uncertain branch behavior. Distinguish source/CI, DEV and Production verification. Preserve original PR branches and historical defect evidence. Live HP testing is unnecessary for this integration and must follow a reviewed safe-outcome design, not merely a green baseline reproduction.

## Next work

1. Finish #241's combined checks, merge by exact head using merge commit, then verify #238–#241 and the Production deployment's exact main SHA. No Supabase mutation or runtime HP invocation is needed to deliver this payload. Current docs/test/CI changes do not alter src/ or migration files.
2. Next code change: fresh main-based HP/level-up validation and regression tests (B01/B02), plus a separately reviewed test-only coordinated-writer design (B05). Cover every direct writer, all siblings, creation/relink races, null-safe validation and authorization before locks with post-lock revalidation. Keep baseline defect reproductions as evidence.
3. Reconcile campaign-owner authority (B04) and migration effects/provenance (B08). Prepare live changes only when their design, tests and recovery are ready. Do not use historical fixed-ID data corrections (B06).
4. Then add rules-aware equipment AC/initiative (B03), identity confirmation/labels (B07) and further D&D mechanics. The archive matrix retains the original SHA, scope, source paths and acceptance criteria for every old PR.

## Continuation

Local checkpoint: ../DM_WORKSPACE_RESUME.md; detailed local evidence: ../audit-evidence/. Keep the checkpoint concise after verified milestones. Historical security/migration audits remain intact. Avoid rereading the entire history or rerunning passed checks without a new reason.
