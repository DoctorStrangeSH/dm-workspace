# DM Workspace — current AI handoff (2026-10-29)

Read repository AGENTS.md, AI_PROJECT_AUTHORIZATION.md, then CHARACTER_HP_VALIDATION.md and PR_BACKLOG_TRIAGE_2026-10-28.md. Refresh refs, PR states and deployment checks. A closed PR is not necessarily merged; a passing defect reproduction is not a fix.

## Current checkpoint (supersedes historical source checkpoints below)

#246 is delivered: expected head53dca1b94eeb3ed5cf0c8a9c62c75bd69abd5325 merged into main993577e56aac856d27e5cbb4d2e666b0a1668540; PR CI40867178146 and main CI40867410081 succeeded. Production dpl_HvvZeU5ZpFh3kmfXbepZqdXe6i16 and independent dm-workspace.vercel.app lookup were READY at that main SHA. Public root/login requests timed out; live authenticated save acceptance and existing-row repair are unverified. Receipt ../audit-evidence/character-creation-hp-2026-10-29/release.json.

Active branch fix/character-creation-class-contract starts at that main and fixes prefixed SRD class IDs at new-character creation (canonical identity enables progression/spellcasting) plus the already-displayed fallback catalog. Read the creation follow-up in CHARACTER_HP_VALIDATION.md. Local43 character tests,6 navigation/date tests and23 offline Chromium scenarios pass; types pass; lint0 errors/2 existing warnings. Source checkpoint only: inspect final-head CI, Preview, merge and Production before claiming delivery. Existing rows, DB schema, installed HP RPC and manual harness remain untouched. After release refresh ../DM_WORKSPACE_RESUME.md and save the receipt; then prioritize authenticated GM/player/mobile acceptance where sessions are available and remaining product backlog.

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

## Released navigation (#244)

PR #244 merged by expected head21c10cbeea649097178a2cdf251bbe3a599bfc65 into mainba4ebf95016f0c87684149a89ba982c6b133423b. PR CI40838727741 and main CI40838986670 passed. Production dpl_9SFVqA8R6UrVdLtEBiNEbTJZiMJt and independent alias dm-workspace.vercel.app read were READY at exact main. Open PR inventory was zero. Receipt: ../audit-evidence/campaign-navigation-2026-10-29/release.json. Public HTTP smoke was not confirmed because Node/PowerShell/IAB timed out; it timed out again at the start of this follow-up. Do not reuse #243 HTTP200 as current evidence.

## Overview/editor source checkpoint

Branch feat/campaign-overview-and-editor starts at released mainba4ebf95016f0c87684149a89ba982c6b133423b. Read CAMPAIGN_OVERVIEW_AND_EDITOR_UX.md. It adds role-specific overview actions/shortcuts, localized statistics/activity, distinct empty/unavailable states, notes breakdown and shrinkable activity layout. The chapter editor has44px labelled tools, mobile preview consistency, translated placeholder/save announcements and no read-only save callback. Global mobile padding preserves bottom-navigation clearance. Existing access queries, server writes and autosave implementation are preserved.

Local checks:36 character tests,6 pure navigation/date tests,19 real-component Chromium scenarios; TypeScript passed, ESLint0 errors/2 pre-existing Realtime warnings. Browser save/export/message/Realtime/navigation/theme boundaries are synthetic. No authenticated campaign session or live save/export acceptance. No database or HP rollout. Inspect final-head CI, Preview, merge and Production receipts before treating this source checkpoint as delivered.

## Authority and next work

The owner explicitly authorizes necessary code changes, PR merges, Production releases and Supabase changes end to end; exact instruction: AI_PROJECT_AUTHORIZATION.md. Earlier blanket prohibitions in historical reports are superseded. Do not re-ask for routine covered steps. Still inspect the intended project/environment and revision, review changes, test and verify results; live DB work needs suitable recovery, migration-effect reconciliation and DEV verification.

Publish explicit feature refs with expected-head/absent-branch leases and merge reviewed PRs with expected head SHA. Never write directly to main or use GitHub file mutation tools with uncertain branch behavior. Preserve history and secrets. Distinguish source/CI, DEV and Production evidence.

Finish the overview/editor follow-up through final-head CI/Preview and verified Production release. The user's broader design request remains an ongoing product direction; this pass targets campaign tools/chat/identity labels. Next inspect real authenticated GM/player/mobile use when sessions are available, then remaining editors/navigation. Keep coordinated-writer safe-outcome design (B05), campaign-owner authority (B04), provenance (B08) and progression rules explicit in the backlog. Later: equipment AC/initiative (B03) and deliberate per-record recovery (B06). Local continuation note: ../DM_WORKSPACE_RESUME.md; raw evidence: ../audit-evidence/. Keep notes concise after verified milestones.

## Verified overview/editor release and new HP creation follow-up

PR #245 merged by expected head b0640e822a1217d55199751de89f311644487bff into main095ef37fc9401a6a0d30c4b8dbf74e5d57d3352a. PR CI40841988819 and main CI40842362549 SUCCESS. Preview dpl_Aq3np5fciQx5f8Sb9ooxW8rs8dw6 and Production dpl_Hz5cXKu93btxujdmEj9QsA1SdyAs were READY at their matching commits; independent dm-workspace.vercel.app lookup confirmed Production. Public root/login timed out; IAB rendered only an empty accessibility tree. No authenticated campaign/live save/export acceptance. Receipt ../audit-evidence/campaign-overview-2026-10-29/release.json supersedes pending-source wording above.

The owner then reported D62 HP on creation review (human sorcerer1, CON15). This branch fix/character-creation-hit-die normalizes SRD die strings in the actual adapter and uses supported class defaults for invalid/missing dice. Read CHARACTER_HP_VALIDATION.md's creation regression section. Local40 character tests and 19 existing browser scenarios passed; two new full-wizard desktop/mobile scenarios passed after correcting required-field selectors. Types passed; lint has0 errors and2 existing warnings. Review final-head CI/Preview and Production before claiming release. No migration, installed HP RPC, manual harness or saved-player-data mutation; coordinated HP writers remain unresolved.
