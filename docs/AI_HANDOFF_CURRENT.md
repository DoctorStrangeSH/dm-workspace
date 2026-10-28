# DM Workspace — AI handoff (2026-10-28)

> Living checkpoint for the next AI engineer. Verify current GitHub/Supabase/Vercel state before acting. This file describes confirmed repository metadata and code, not a full live production acceptance.

## Baseline
- Repository: `DoctorStrangeSH/dm-workspace`; default branch `main`.
- At checkpoint refresh (2026-10-28): main commit after PR #234 is `54e1ae19e931e8e7467a715ec031d4c3a6bbb7f6`; refresh this SHA after the next merge.
- GitHub PR search: PR inventory numbers in this file are stale; refresh counts from GitHub search before relying on them. Highest known PR is #234.
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
- #229 merged: refreshed this handoff after closing obsolete Preview PRs.
- #232 merged: refreshed handoff after mobile controls #231.
- #233 merged: adds `docs/HP_WRITE_PATH_AUDIT.md`, a source audit confirming the direct token-only HP writer remains in main and combat/character writes are separate operations.
- #234 merged: adds `docs/HP_ATOMIC_ROLLOUT_CONTRACT.md` with transaction semantics and release gates.
- Read-only DEV inspection (project ref `yoondivyeueyrtgeldja`) found `public.apply_token_hp_atomic(uuid,uuid,integer,text,integer)` exists, is executable by `authenticated`, lacks a REVIEW ONLY barrier, and does not propagate to sibling tokens. The reported DEV migration list has only six 2026-10-27 migrations and no atomic HP migration. Catalog metadata: function owner `postgres`, `SECURITY DEFINER`, empty `search_path`, EXECUTE granted to `authenticated` (not `anon`), no review-only barrier, and no sibling-token propagation. No HP-coordinating triggers were found on `tokens`/`characters`. This is a high-priority migration-provenance and authorization review item. Read-only review of the installed body confirms it locks token first then character (opposite contract order), validates selected token/character HP agreement and expected HP, but updates only the selected token plus character JSON and does not propagate to sibling tokens. No HP RPC was called and no database rows were changed. Do not test on real data; review its full body/grants and migration provenance first, then prepare disposable fixtures.
- #231 merged: mobile character controls clean-port from #130–#134. Improves level-up dialog scrolling/safe areas, sticky wizard navigation, class editor touch targets, HP control touch targets and accessible input labels, and ability/save/skill roll affordances. GitHub Actions lint/typecheck/build and PR checks passed after fixing one JSX syntax error. Vercel deployment remains rate-limited, so Preview/device QA is not yet verified.
- #51 and #52 were closed without merge as obsolete Draft-only integration Preview/smoke-test branches. The later UI implementations are already in main; if old smoke coverage is still needed, port only relevant tests into a current main-based PR.
- Prior isolated #45–#50 design PRs were **closed without merge**; their refreshed implementations were ported in later merged integration PRs. Avoid merging old stacks again.
- #51 and #52 are **closed without merge** obsolete Draft integration Preview/smoke-test branches; do not reopen or merge their old branch stacks.

## Open PR triage
- #226 is **merged**. Older draft PRs #129, #135, #136, and #137 were closed with explanatory comments as superseded by #226. These are not merged PRs; their required mobile improvements are in #226.
- #182 remains open and NOT merged. Current `main` still has a direct token-only `updateTokenHP` writer in `src/lib/actions/tokens.ts`. Combat `damageToken` updates the token and character separately with best-effort rollback; `updateCharacterHP` uses CAS but does not coordinate token rows. See `docs/HP_WRITE_PATH_AUDIT.md` for the verified static source audit and `docs/HP_ATOMIC_ROLLOUT_CONTRACT.md` for required transaction semantics and release gates.
- Large old stacked HP chain (#72–#172 and related PRs) is largely **draft** with bases pointing to other feature branches. Do not mass-merge, retarget, or close. Classify as superseded vs still needed by comparing diffs against current main.
- Keep docs-only SQL drafts separate from applied production schema. Check actual dependency graph, current head SHAs, CI, and existing fixes before selecting a clean-port change.

## Critical HP and database safety
- Character HP, token HP, sibling tokens, death saves, long rest, level-up and concurrent updates require transactional consistency, correct lock ordering, CAS protection, and strict campaign authorization. `docs/HP_WRITE_PATH_AUDIT.md` records current writer gaps and acceptance gates.
- DEV-only atomic HP work/runner is not evidence of safe production rollout; some PRs specifically state the RPC is gated/disabled. Verify live DEV installation and independent authenticated-session races before any PROD migration.
- `docs/character-identity-rpc-dev-verification.md` notes simulated DEV SQL role tests and narrow writer races, not equivalent to independent real JWT end-to-end tests.
- There are two distinct Supabase projects. DEV is disposable test space; PROD contains real data. **No destructive changes or unverified schema writes to PROD.**
- Preserve the tested security migration order, take an independently restorable PROD backup first, run DEV migration/preflight and real app acceptance, then coordinated production release. Compare deployed app env URLs (without revealing credentials), schemas, RLS, Storage and Realtime. No third Supabase project is required for routine work.
- Never log or commit service role keys, user credentials or test JWTs.
- Fresh DEV catalog checkpoint (2026-10-28, 10:16–10:24 UTC): see `docs/HP_DEV_METADATA_RECONCILIATION.md`. All catalog/constant-expression batches were read-only; no application RPC or player rows were queried. The six-entry migration ledger differs from repository versions and its statement texts do not mention the installed HP/CAS/identity routine names. The installed HP RPC still lacks the agreed lock/sibling protocol; missing JSON HP keys can also bypass its NULL-sensitive checks. Do not replay migrations, invoke that RPC or run the manual workflow. Next: isolated local PostgreSQL transaction/authorization tests from captured metadata, then a reviewed reconciliation/migration design. #238 is an unmerged preparation Draft.

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
2. Review `docs/HP_WRITE_PATH_AUDIT.md`, then inventory remaining open PRs against current main; close only verified superseded branches with rationale. #129/#135/#136/#137, #130–#134, #43/#44, and #51/#52 are closed as superseded.
3. Do not merge #182 yet: current main still has direct token HP writes, and `damageToken` is multi-step/best-effort rather than atomic. Use the new audit to define the full writer inventory and transaction contract.
4. Follow `docs/HP_ATOMIC_ROLLOUT_CONTRACT.md`. Important live DEV finding: a callable `apply_token_hp_atomic` exists outside the six recorded migrations and lacks sibling-token propagation. Inspect installed function ownership/full definition and migration drift read-only before using it. It was not called; no row mutations were performed. Never run it on real player data. Then test only with disposable fixtures and independent authenticated sessions.
5. Only after stabilizing backlog proceed to new mechanics and product improvements.

## For the next AI
Read this file first, then `AGENTS.md`, `package.json`, `docs/security/PR37_HANDOFF_FOR_NEXT_AI.md` (historical; may be stale), `docs/character-identity-rpc-dev-verification.md`, and current open PR descriptions. Distinguish **verified code state**, **DEV verification**, and **PROD verification** in every report. Never assume a closed PR was merged. Avoid repeating already-passed checks unless code/infra changed.
