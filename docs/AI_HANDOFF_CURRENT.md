# DM Workspace — current AI handoff (2026-10-29)

Read repository AGENTS.md, AI_PROJECT_AUTHORIZATION.md, then CHARACTER_HP_VALIDATION.md and PR_BACKLOG_TRIAGE_2026-10-28.md. Refresh refs, PR states and deployment checks. A closed PR is not necessarily merged; a passing defect reproduction is not a fix.

## Latest delivered baseline

- Repository DoctorStrangeSH/dm-workspace; main 303066d8f970944bdb8cc4aed4244d3439e35b26 delivered #238–#241 through #241's expected-head merge. GitHub confirmed all four merged; open PR inventory was zero before the current validation work.
- Combined CI 40709233321 / local PostgreSQL CI 40709233397 passed. Post-merge main CI 40829453774 passed. Production dpl_6DrMomDMvBe9W9K4Y33XDMxgSnP3 was READY at that main SHA, alias dm-workspace.vercel.app; public entry/login returned HTTP 200. This delivered evidence/tests, not HP fixes.
- 84 obsolete delivery PRs were closed without merge, reviewed heads read back, and all 84 branches verified preserved. Receipts: verification/pr_archive_results_2026-10-28.json. #237 was then closed without merge because its harness blockers are preserved in backlog B05. Historical open-PR counts in old reports are snapshots.

## Current validation change

- Main-based branch fix/character-hp-level-up-validation adds application-side HP validation at create/full JSON/manual/shared CAS saves; strict level/class/ability/method/ASI/gain validation before level-up; numeric overflow rejection; deterministic UI preview and +2 cap enforcement. Read CHARACTER_HP_VALIDATION.md for exact behavior and legacy temp compatibility.
- Local character suite: 35 tests passed, including all 12 classes/die outcomes, actual actions with a recording mock DB, original-CAS retention/stale failure and static rendering of the real dialog with no randomness. TypeScript passed; full ESLint had no errors and two pre-existing Realtime cleanup warnings. The new suite is in ordinary CI. Check the current PR's final head/checks/Production result; do not infer delivery from this source checkpoint.
- No database schema or migration change. These are server-action guards, not a restriction on authorized direct REST/SQL writes. No real player data is repaired. Authenticated browser/JWT/Realtime acceptance is not established by mocked action/static-render tests.
- B01/B02 remain partially open: raw-data rendering/recovery, complete CON/ASI/feat rules and other progression behavior require separate work. This patch preserves the app's existing healing/spell-slot and shared ASI schedule. It does not add retroactive HP for CON increases or class-specific extra ASI levels.

## HP evidence and remaining risks

- HP_WRITE_PATH_AUDIT.md and HP_ATOMIC_ROLLOUT_CONTRACT.md inventory uncoordinated writers. Character/combat JSON CAS and identity-only updates exist, but token-only UPDATE, separate combat writes, stale siblings and link races remain unresolved.
- HP_DEV_METADATA_RECONCILIATION.md records read-only DEV metadata, missing-key SQL NULL validation, token-first/single-token locking, broad authorized direct writers and migration-effect drift. Exact inspection SQL is in verification/. Do not blindly replay migrations or repair ledger rows.
- HP_SAFE_HARNESS.md describes a dry-run-by-default CLI with 32 offline safety tests; CI only runs mocked requests. It has no manual live workflow. Do not use its mutation mode on the known-broken installed routine merely to finish a PR.
- HP_LOCAL_POSTGRES_BASELINE.md and tests/hp-postgres/README.md describe the 41-scenario (42 Node tests including parent) isolated PostgreSQL baseline. It owns a new loopback-only cluster, accepts no remote DB URL, verifies identity/fingerprints and stops it. Known missing-key, stale sibling, direct-writer, lock and creation-race defects are intentionally reproduced. Local UUID/Realtime shims do not prove live JWT/API acceptance. Preserve this evidence when adding safe-outcome tests.

## Authority and next work

The owner explicitly authorizes necessary code changes, PR merges, Production releases and Supabase changes end to end; exact instruction: AI_PROJECT_AUTHORIZATION.md. Earlier blanket prohibitions in historical reports are superseded. Do not re-ask for routine covered steps. Still inspect the intended project/environment and revision, review changes, test and verify results; live DB work needs suitable recovery, migration-effect reconciliation and DEV verification.

Publish explicit feature refs with expected-head/absent-branch leases and merge reviewed PRs with expected head SHA. Never write directly to main or use GitHub file mutation tools with uncertain branch behavior. Preserve history and secrets. Distinguish source/CI, DEV and Production evidence.

Finish the current validation PR through final-head CI/Preview and verified Production release. Then address the remaining progression rules and coordinated-writer safe-outcome design (B05), campaign-owner authority (B04) and provenance (B08). Later: rules-aware equipment AC/initiative (B03), identity UX/labels (B07) and deliberate per-record recovery (B06). Local continuation note: ../DM_WORKSPACE_RESUME.md; raw evidence: ../audit-evidence/. Keep notes concise after verified milestones.
