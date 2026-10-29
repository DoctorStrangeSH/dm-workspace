# DM Workspace — current AI handoff (2026-10-29)

Read repository AGENTS.md, AI_PROJECT_AUTHORIZATION.md, then CHARACTER_HP_VALIDATION.md and PR_BACKLOG_TRIAGE_2026-10-28.md. Refresh refs, PR states and deployment checks. A closed PR is not necessarily merged; a passing defect reproduction is not a fix.

## Latest delivered baseline

- Repository DoctorStrangeSH/dm-workspace; main 303066d8f970944bdb8cc4aed4244d3439e35b26 delivered #238–#241 through #241's expected-head merge. GitHub confirmed all four merged; open PR inventory was zero before the current validation work.
- Combined CI 40709233321 / local PostgreSQL CI 40709233397 passed. Post-merge main CI 40829453774 passed. Production dpl_6DrMomDMvBe9W9K4Y33XDMxgSnP3 was READY at that main SHA, alias dm-workspace.vercel.app; public entry/login returned HTTP 200. This delivered evidence/tests, not HP fixes.
- 84 obsolete delivery PRs were closed without merge, reviewed heads read back, and all 84 branches verified preserved. Receipts: verification/pr_archive_results_2026-10-28.json. #237 was then closed without merge because its harness blockers are preserved in backlog B05. Historical open-PR counts in old reports are snapshots.

## Released HP validation (#242)

- Main-based branch fix/character-hp-level-up-validation adds application-side HP validation at create/full JSON/manual/shared CAS saves; strict level/class/ability/method/ASI/gain validation before level-up; numeric overflow rejection; deterministic UI preview and +2 cap enforcement. Read CHARACTER_HP_VALIDATION.md for exact behavior and legacy temp compatibility.
- #242 was merged by expected head 4ab4ecc8be970df0789d3884a1e43d6a12f98a07 into main 14307788ded0c3378d399f30d95accb1912a6614. PR CI 40832275676 and main push CI 40832708318 passed. Production dpl_6JHT5zsWiPd89rttMyGn91FxfJ6f was READY at that exact SHA; alias and public root/login HTTP 200 were read back. Local release receipt: ../audit-evidence/pr-triage-2026-10-28/pr-242-release-2026-10-29.json.
- Local character suite: 35 tests passed, including all 12 classes/die outcomes, actual actions with a recording mock DB, original-CAS retention/stale failure and static rendering of the real dialog with no randomness. TypeScript passed; full ESLint had no errors and two pre-existing Realtime cleanup warnings. The new suite is in ordinary CI. Check the current PR's final head/checks/Production result; do not infer delivery from this source checkpoint.
- No database schema or migration change. These are server-action guards, not a restriction on authorized direct REST/SQL writes. No real player data is repaired. Authenticated browser/JWT/Realtime acceptance is not established by mocked action/static-render tests.
- B01/B02 remain partially open: raw-data rendering/recovery, complete CON/ASI/feat rules and other progression behavior require separate work. This patch preserves the app's existing healing/spell-slot and shared ASI schedule. It does not add retroactive HP for CON increases or class-specific extra ASI levels.

## HP evidence and remaining risks

Fresh pre-UX verification on 2026-10-29 passed the 35-test character suite and all 42 local PostgreSQL tests; the owned cluster was stopped. Known SQL defects remain reproduced, not repaired. The owner requested moving from HP checks to a modern workspace, better-positioned Chat/GM tools, a more usable chat and class/species translations. This UX pass is independent of a live HP rollout.

- HP_WRITE_PATH_AUDIT.md and HP_ATOMIC_ROLLOUT_CONTRACT.md inventory uncoordinated writers. Character/combat JSON CAS and identity-only updates exist, but token-only UPDATE, separate combat writes, stale siblings and link races remain unresolved.
- HP_DEV_METADATA_RECONCILIATION.md records read-only DEV metadata, missing-key SQL NULL validation, token-first/single-token locking, broad authorized direct writers and migration-effect drift. Exact inspection SQL is in verification/. Do not blindly replay migrations or repair ledger rows.
- HP_SAFE_HARNESS.md describes a dry-run-by-default CLI with 32 offline safety tests; CI only runs mocked requests. It has no manual live workflow. Do not use its mutation mode on the known-broken installed routine merely to finish a PR.
- HP_LOCAL_POSTGRES_BASELINE.md and tests/hp-postgres/README.md describe the 41-scenario (42 Node tests including parent) isolated PostgreSQL baseline. It owns a new loopback-only cluster, accepts no remote DB URL, verifies identity/fingerprints and stops it. Known missing-key, stale sibling, direct-writer, lock and creation-race defects are intentionally reproduced. Local UUID/Realtime shims do not prove live JWT/API acceptance. Preserve this evidence when adding safe-outcome tests.

## Released workspace UX (#243)

PR #243 merged by expected head 0fe80c6904b8f71d9ec0de9893f34e7e75e173f9 into main 42e3305965a0b883e2375cca89f47abf8331152e. PR CI 40835872371 and main CI 40836209330 passed. Production dpl_DFuvVv1PVfoWieqyZCmCxLxyNiaJ was READY at that exact main, independently confirmed through dm-workspace.vercel.app; public root/login returned 200. Open PR count was zero. Read CAMPAIGN_WORKSPACE_UX.md: labelled Chat/GM controls, responsive panels, draft/history/send improvements, session pane fixes and RU/EN character names are delivered. Local verification: 36 character tests, 9 Chromium scenarios, types pass and 2 pre-existing lint warnings. Receipt: ../audit-evidence/campaign-ux-2026-10-29/release.json.

## Navigation follow-up source checkpoint

Branch feat/campaign-navigation-shell starts at released main 42e3305965a0b883e2375cca89f47abf8331152e. It separates campaign identity/search/appearance and tool rows, groups desktop routes, measures sidebar offsets and provides one mobile drawer from header Menu and bottom More. Native modal focus/Escape/backdrop/resize handling, role filtering, active route boundaries, translated labels and 44px targets are covered by 13 offline Chromium scenarios and 3 pure navigation tests. Refresh final head, CI, Preview and Production status before treating this checkpoint as delivered. Browser boundaries include navigation, messages/Realtime and theme persistence; search/secondary action placeholders stress layout. No authenticated campaign session was available. Screenshots show synthetic fixture data, not live gameplay.

## Authority and next work

The owner explicitly authorizes necessary code changes, PR merges, Production releases and Supabase changes end to end; exact instruction: AI_PROJECT_AUTHORIZATION.md. Earlier blanket prohibitions in historical reports are superseded. Do not re-ask for routine covered steps. Still inspect the intended project/environment and revision, review changes, test and verify results; live DB work needs suitable recovery, migration-effect reconciliation and DEV verification.

Publish explicit feature refs with expected-head/absent-branch leases and merge reviewed PRs with expected head SHA. Never write directly to main or use GitHub file mutation tools with uncertain branch behavior. Preserve history and secrets. Distinguish source/CI, DEV and Production evidence.

Finish the navigation follow-up through final-head CI/Preview and verified Production release. The user's broader design request remains an ongoing product direction; this pass targets campaign tools/chat/identity labels. Next inspect real authenticated GM/player/mobile use when sessions are available, then remaining editors/navigation. Keep coordinated-writer safe-outcome design (B05), campaign-owner authority (B04), provenance (B08) and progression rules explicit in the backlog. Later: equipment AC/initiative (B03) and deliberate per-record recovery (B06). Local continuation note: ../DM_WORKSPACE_RESUME.md; raw evidence: ../audit-evidence/. Keep notes concise after verified milestones.
