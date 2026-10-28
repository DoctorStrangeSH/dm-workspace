# DM Workspace — AI handoff (2026-10-28)

> Living checkpoint for the next AI engineer. Verify current GitHub/Supabase/Vercel state before acting. This file describes confirmed repository metadata and code, not a full live production acceptance.

## Baseline
- Repository: `DoctorStrangeSH/dm-workspace`; default branch `main`.
- At checkpoint refresh (2026-10-28): main commit `ae71be28d1720cb02235635e44e886673335feca` (PR #226).
- GitHub PR search: **84 merged, 53 closed without merge, 90 open** (227 total observed), highest PR #229. Counts change as triage continues. Counts will change.
- Architecture: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Supabase Postgres/Auth/RLS/Realtime/Storage, Vercel. Core areas: campaigns, chapters, entities, characters/level-up/inventory/spells, scenes/VTT/initiative/HP, sessions, handouts/music, SRD.
- Source of truth: current `main`, tracked SQL migrations, live DEV and PROD migration histories, deployment status. Do not rely on stale README roadmap or older PR descriptions as proof of current deployment.

## Confirmed merged work
- #37 security planning merged; substantial Realtime/Storage changes also appear in `main` SQL migrations and later PRs.
- #183–#186 integrate refreshed dashboard/campaign UI and VTT interactions.
- #187–#192 VTT realtime reconciliation, initiative, token UI.
- #193–#197 inventory/spellbook/mobile UX.
- #198–#217 SRD class/subclass, character identity atomic RPC, CAS safeguards, UI.
- #218–#225 database/storage authorization, invite codes, RSVP, entity integrity and security audit documentation.
- #226 merged: responsive mobile bottom navigation, combat-stat cards and character tabs; adds keyboard navigation (arrows, Home/End) and ARIA tab/panel relationships. GitHub Actions lint/typecheck/build and PR security test jobs passed. Vercel reported build rate limiting, so deployment/Preview was not verified.
- #227 merged: initial handoff document.
- #228 merged: refreshed this handoff after #226; the PR itself was documentation-only.
- #51 and #52 were closed without merge as obsolete Draft-only integration Preview/smoke-test branches. The later UI implementations are already in main; if old smoke coverage is still needed, port only relevant tests into a current main-based PR.
- #43 and #44 were closed without merge as superseded: DM quick actions are included by #185, and the VTT interaction work is included by #186.
- Prior isolated #45–#50 design PRs were **closed without merge**; their refreshed implementations were ported in later merged integration PRs. Avoid merging old stacks again.
- #51 and #52 are **closed without merge** obsolete Draft integration Preview/smoke-test branches; do not reopen or merge their old branch stacks.

## Open PR triage
- #226 is **merged**. Older draft PRs #129, #135, #136, and #137 were closed with explanatory comments as superseded by #226. These are not merged PRs; their required mobile improvements are in #226.
- #182 open: routes token HP setter through existing combat path, but PR explicitly says this is **not** transaction-level or sibling-token atomicity. Review against current main before merging.
- Large old stacked HP chain (#72–#172 and related PRs) is largely **draft** with bases pointing to other feature branches. Do not mass-merge, retarget, or close. Classify as superseded vs still needed by comparing diffs against current main.
- Keep docs-only SQL drafts separate from applied production schema. Check actual dependency graph, current head SHAs, CI, and existing fixes before selecting a clean-port change.

## Critical HP and database safety
- Character HP, token HP, sibling tokens, long rest, level-up and concurrent updates require transactional consistency, correct lock ordering, CAS protection, and strict campaign authorization.
- DEV-only atomic HP work/runner is not evidence of safe production rollout; some PRs specifically state the RPC is gated/disabled. Verify live DEV installation and independent authenticated-session races before any PROD migration.
- `docs/character-identity-rpc-dev-verification.md` notes simulated DEV SQL role tests and narrow writer races, not equivalent to independent real JWT end-to-end tests.
- There are two distinct Supabase projects. DEV is disposable test space; PROD contains real data. **No destructive changes or unverified schema writes to PROD.**
- Preserve the tested security migration order, take an independently restorable PROD backup first, run DEV migration/preflight and real app acceptance, then coordinated production release. Compare deployed app env URLs (without revealing credentials), schemas, RLS, Storage and Realtime. No third Supabase project is required for routine work.
- Never log or commit service role keys, user credentials or test JWTs.

## Release routine
1. Inspect current main and PR dependency graph; identify whether change is already merged, obsolete, or requires a clean port.
2. Prefer small PRs targeting `main`; do not republish deep old stacked chains.
3. Run lint, TypeScript, production build, relevant unit, security and Playwright tests; inspect current GitHub Actions statuses. CI green alone does not validate Auth/Storage/Realtime.
4. Confirm Vercel Preview points to DEV Supabase before test mutations. Manually verify GM/player permissions, desktop/mobile, light/dark, relevant Realtime flows and visual regressions.
5. For database work: review migration history and rollback/backup plan; test real DEV first; deploy to PROD only after all gates and approval.
6. After merge, confirm production deployment, smoke-check, then close **only** verified superseded PRs with explanatory links.
7. Update this handoff with latest main SHA, PR counts, gate results and next concrete task.

## Next priority
1. Vercel is rate-limited (reported retry after 24 hours as of 2026-10-28); confirm deployment/Preview status when builds are available again. GitHub Actions passed for #226 and #228, but Vercel deployment/Preview remains unverified. Do not confuse GitHub Actions success with a verified Vercel deployment.
2. Continue inventory of remaining open PRs against merged #183–#226; close verified superseded branches with rationale. #43/#44, #51/#52, and #129/#135/#136/#137 are closed as superseded.
3. Review mobile character UX chain #130–#134. These are stacked drafts not merged; compare each diff to current main and clean-port relevant touch-target/dialog changes into a main-based PR only after review. Do not merge their old stack directly; Vercel Preview/manual device QA remains blocked.
4. Review #182 carefully: it routes token HP through the shared combat action but explicitly does not guarantee transaction-level or sibling-token atomicity. Do not treat it as the final HP fix.
5. Separately design a single clean and verifiable path for HP atomicity (all tokens, combat, rest, level-up), preserving database safeguards.
6. Only after stabilizing backlog proceed to new mechanics and product improvements.

## For the next AI
Read this file first, then `AGENTS.md`, `package.json`, `docs/security/PR37_HANDOFF_FOR_NEXT_AI.md` (historical; may be stale), `docs/character-identity-rpc-dev-verification.md`, and current open PR descriptions. Distinguish **verified code state**, **DEV verification**, and **PROD verification** in every report. Never assume a closed PR was merged. Avoid repeating already-passed checks unless code/infra changed.
