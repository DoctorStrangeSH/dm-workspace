# Atomic HP: DEV verification matrix and completion gates

Status: planning and code review only. Confirmed DEV: `dm-workspace`; production: `dm-workspace-prod`. Do not run mutation tests on production.

## Gate 1 — prerequisites
- Review all stacked PRs #73–#90 and ensure CI passes, particularly the character data CAS changes.
- Verify PR #90's snapshot fix with a concurrent-edit test.
- Review the SQL draft for privileges, RLS, and its owner vs DM membership policy.
- Verify a single character HP source of truth and all legacy writers (token editing, combat, rests, death saves, character editor).

## Gate 2 — controlled DEV install
- Create **disposable** campaign, scene, character, token and separate test accounts (not existing player fixtures).
- After explicit approval for DEV schema changes, install the reviewed RPC in DEV only. Verify exact function signature, EXECUTE grants and no anonymous access.
- Verify the feature flag is disabled by default, and enabled only for confirmed DEV.

## Gate 3 — functional and adversarial tests
| Case | Expected |
|---|---|
| Damage 3 and damage 4 concurrently from 20 | Final HP 13 for token and linked character |
| Heal 5 and damage 2 concurrently | Serially consistent result, no lost update |
| Set with stale expected HP | Error; no database write |
| Nonmember, anonymous and cross-campaign access | Denied |
| DM owner, primary token owner, delegated owner | Allowed only when membership and ownership rules hold |
| Linked character with inconsistent HP | Entire operation rejected, no partial write |
| Character spell/inventory edited concurrently | Non-HP fields preserved; no blind JSON replacement |
| Missing or invalid character HP | Error and rollback |
| Realtime clients | Observe eventual consistent state |

## Gate 4 — integration
- Replace best-effort token/character dual writes with transactional RPC for all active HP entry points.
- Coordinate direct character HP changes, long rest and death-save recovery with linked-token behavior.
- Verify no competing direct writer bypasses the intended locking / version semantics.

## Gate 5 — release
- Collect CI and DEV test evidence, review security and migration rollback plan.
- Merge stacked PRs in a deliberate order after review.
- Separately authorize production migration and deployment only after DEV acceptance.

## Definition of done
Two simultaneous users can damage/heal the same token and see consistent token/character HP, unauthorized users cannot mutate it, unrelated character fields survive, and regression tests cover conflicting writers. No production changes without a separate decision.
