# HP evidence integration — 2026-10-28

PR #241 integrates four previously separate deliverables without changing src/ or supabase/migrations/:

| Source PR | Reviewed head included by Git ancestry | Payload |
| --- | --- | --- |
| #238 | 586d18c378721dc47b58769c64e6be3df46c0d2d | Dry-run-by-default DEV CLI and 32 mocked-request safety tests; CI runs the offline tests only |
| #239 | a23d8fb2396a99d92b90d6b6064ff29c726d702a | Read-only DEV metadata reconciliation and exact inspection SQL |
| #240 | 4986bc4290f4e179a235930e45ffa119aba41d3d | Isolated local PostgreSQL baseline, fixture/provenance and PR-only CI |
| #241 | aa460cd803a13683c8e11b21d46143103544d5fc (before integration) | Archive matrix, acceptance backlog, 84 closure receipts and concise handoff |

The only merge conflicts were competing edits to AI_HANDOFF_CURRENT.md. The consolidated handoff keeps the latest archive/authorization state and links all detailed reports. Unique source/test/audit files were preserved. The repository allows merge commits; use a merge commit for #241 so the original #238–#240 heads remain reachable from main. Re-read each original head before release, then verify GitHub's merge state for all four PRs. Do not manually label an unmerged PR as merged.

## Local combined verification

- Offline harness: 32 tests passed, zero failed. Requests were injected mocks, including the subprocess crash test; no live Auth or RPC.
- Local PostgreSQL 17.10: 41 scenarios passed (42 Node tests including the parent), zero failed; fixture fingerprints checked; newly owned loopback-only cluster stopped successfully. Results: ignored tests/hp-postgres/results/latest.json. Historical committed baseline results remain unchanged.
- All three source heads were verified as ancestors of the integration branch. No application source or migration file differs from the base main. Staged whitespace check is required on the final commit.
- Combined GitHub quality/security CI, isolated Linux PostgreSQL CI and Vercel Preview must pass for the final integration head. Original-head checks do not validate the final integration.

## Release scope and remaining defects

The owner now authorizes necessary releases and Supabase changes; see AI_PROJECT_AUTHORIZATION.md. This payload needs no live database change, installed HP RPC invocation or manual HP workflow. The deployed application behavior is unchanged. After merge, confirm the Production deployment belongs to DoctorStrangeSH/dm-workspace, the dm-workspace Vercel project and the resulting main SHA; verify READY and perform a read-only public-page check.

The baseline intentionally reproduces defects. Missing HP keys, stale siblings, uncoordinated direct writers, authorization-after-lock and token-creation races remain unresolved, as do B01–B08 in the archive backlog. A green integration is delivery of evidence and tests, not HP correctness or real JWT/Realtime acceptance. Next: main-based validation/progression guards and safe-outcome coordinated-writer design.
