# Integration release gates — stacked D&D Workspace work

Status: **NOT approved for production merge solely on the strength of CI**.

## Verified baseline (2026-10-27)

- Integration head: `fix/mobile-bottom-nav-labels` (PR #144).
- Compare `main...fix/mobile-bottom-nav-labels`: **171 commits ahead, 0 behind, 97 changed files**.
- PRs #51–#144 are a stacked chain, with #51 based on `main`. Other open PRs target `main` independently; never assume all open PRs belong to this stack.
- GitHub Actions CI run #181 for PR #144 completed successfully.
- The accumulated diff includes SQL review scripts, token/character HP server actions, combat concurrency changes, character creation/level-up, VTT, and responsive UI. Green unit/lint/build checks alone do **not** prove DB compatibility or mobile viewport behavior.

## Release gates — all required before merging to production-backed `main`

1. **Protect data:** confirm actual deployment/branch wiring and back up relevant data. Validate the intended Supabase environment. Treat `docs/sql/*.REVIEW.sql` as review-only: no automatic execution and no production migration from this plan.
2. **HP/VTT concurrency:** on DEV only, verify `apply_token_hp_atomic` availability/permissions, feature flag status, concurrent writes, character-linked token consistency, and regression/recovery behavior. Record actual results, not assumptions.
3. **Character mechanics:** run creation (base class/subclass), class change, level-up HP/ASI boundary conditions, inventory/equipment bonuses, and spell-slot interactions against DEV test accounts with both DM/player roles.
4. **Privacy/authorization:** confirm player/DM permission boundaries, SRD visibility, storage policies, and that `/dev/atomic-hp-test` cannot be reached as a production testing bypass.
5. **Mobile smoke:** in a browser/physical phone at ~320, 375, 390, 640, and 767px, in portrait and with keyboard visible: header, bottom nav, sidebar scrolling, long character sheets, item/spell forms, and action buttons. Confirm safe-area spacing and no content hidden behind fixed navigation.
6. **Release verification:** run CI on the exact intended merge candidate; review and reconcile independent `main` PRs and migration ordering; deploy to a non-production Preview or staging environment if available. Capture rollback plan and owner acceptance.

## Merge strategy

- **Do not bulk-merge all Draft PRs automatically.** Stacked child branches contain all ancestor work and will not isolate risk when merged directly into `main`.
- For low-risk visual work, create a **new clean branch from current `main`**, cherry-pick or reapply narrowly scoped UI-only changes, run CI and responsive smoke checks, then merge that independent PR when verified.
- Keep HP/RPC/combat changes separate until DEV gates above are complete. Review SQL manually; do not interpret repository files as deployed migrations.
- Once all gates are satisfied, integrate remaining stacked changes in a deliberate order with a single verified candidate; do not merge old child PRs blindly.
- If any gate fails, stop the release and fix/test on isolated branches. Production remains untouched until verified.

## Verification log

| Gate | Status | Evidence |
| --- | --- | --- |
| Stack ancestry and diff size | Verified | GitHub compare main...PR #144: 171/0 commits, 97 files |
| PR #144 CI | Passed | CI run #181 |
| DEV HP concurrency + permission matrix | Pending | Requires active DEV verification |
| End-to-end character mechanics | Pending | DEV scenario results needed |
| Real mobile/browser checks | Pending | Preview quota / device validation |
| Production migration safety and rollback | Pending | Deployment wiring + owner signoff |
