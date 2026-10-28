# DM Workspace — current AI handoff (2026-10-28)

Read this checkpoint, repository AGENTS.md, then PR_BACKLOG_TRIAGE_2026-10-28.md. Refresh live PR/ref/check state before acting. A closed PR is not necessarily merged; an open Draft is not deployed.

## Verified baseline

- Repository: DoctorStrangeSH/dm-workspace; main: `36e406442b10324d9cadf70c1c84ae53d7684e5a`, unchanged. Documentation cleanup is Draft #241 on docs/pr-backlog-triage. All 84 old PRs were closed without merge, each re-read at its reviewed head. All 84 remote source branches remain unchanged. Final open inventory: #237–#241 (five PRs). Read docs/verification/pr_archive_results_2026-10-28.json for per-PR receipts; unfinished B01–B08 are preserved requirements, not implemented fixes.
- Current source has character/combat JSON CAS and identity-only validation, but HP writers remain uncoordinated. Token-only UPDATE, separate combat writes, stale siblings and unsafe level-up inputs remain unresolved. See HP_WRITE_PATH_AUDIT.md and HP_ATOMIC_ROLLOUT_CONTRACT.md.
- #237 (head b0c475219f13fed8a8b88ef398bc31511596e058): documentation of unsafe old harness; Actions success (run 40666735835), Vercel failure from daily deployment limit at this check. Retained; no merge. Its findings are preserved in B05 of the triage.
- #238 Draft (586d18c378721dc47b58769c64e6be3df46c0d2d): preparation-only safe harness, 32 offline tests/Actions passed at the preceding checkpoint. No live run.
- #239 Draft (a23d8fb2396a99d92b90d6b6064ff29c726d702a): read-only DEV metadata reconciliation; prior Actions/Vercel passed. Raw local evidence: ../audit-evidence/hp-dev-2026-10-28/. No ledger repair or migration replay.
- #240 Draft (4986bc4290f4e179a235930e45ffa119aba41d3d): local PostgreSQL baseline. Windows/Linux and CI passed: 41 scenarios, 42 Node tests including parent; runs 40676897221/40676897244. Read HP_LOCAL_POSTGRES_BASELINE.md and tests/hp-postgres/README.md on that branch. These files are not in main. Tests reproduce defects, not fixes. Local role/UUID and Realtime shims do not prove live JWT/API/Realtime behavior.

## Current authorization boundaries

Never invoke the installed HP RPC, run the manual HP workflow, mutate Supabase, apply/repair migrations or change Production under this task. Do not write directly to main or use GitHub file mutation tools: prior branch/ref behavior was unsafe. Publish Git changes only to an explicit feature ref using an expected-head or absent-branch lease; verify remote refs afterwards. Preserve archived PR branches/history. Do not revive old one-click mutation pages or merge old stacks.

## Next work

1. Archive cleanup is complete; finish review/checks for documentation Draft #241. Do not mark B01–B08 implemented or revive old stacks. #241's first head 809f2f709b36642c58ce215d205638ab9e872df6 passed Actions (40679238004) and Vercel; recheck the final receipt commit independently.
2. Priority safe code work: fresh main-based pure validation/level-up tests and guards (B01/B02), plus a separately reviewed test-only coordinated HP writer design (B05). Include all direct writers, sibling locks, creation/relink races, null-safe validation and authorization/revalidation. Baseline defect evidence must remain available.
3. Reconcile campaign-owner authority (B04) and migration effects/provenance (B08) under appropriate later scope. Production rollout and real authenticated acceptance require separate authorization and evidence.
4. Then add rules-aware equipment AC/initiative (B03), identity UX/labels (B07) and further D&D mechanics. Safe recovery B06 is separate from automatic rule changes.

## Continuation and evidence

The triage matrix retains exact SHA, scope, source paths and acceptance criteria for every archived PR. Historical security/migration audits remain intact. Duplicate/stale instructions in this handoff were replaced, not historical evidence. Local continuation note: ../DM_WORKSPACE_RESUME.md. Keep it concise and update after verified milestones; avoid recopying the conversation or rerunning passed checks without a new reason. Distinguish source, CI, DEV and Production verification in reports.
