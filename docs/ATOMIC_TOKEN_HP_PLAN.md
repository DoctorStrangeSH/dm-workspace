# Atomic HP transaction design (DEV-first)

## Current mitigation
`damageToken` now performs compare-and-set on `tokens.hp_current` and returns a conflict rather than silently overwriting a newer token HP value. This is **not fully atomic** across token and linked character data.

## Known remaining race
The existing character synchronization consists of later JSONB reads and writes. Parallel character HP changes or updates to other `characters.data_json` fields can conflict after the token update. Best-effort rollback is not a transaction and must not be considered sufficient concurrency protection.

## Proposed isolated DEV migration (not applied)
Introduce a database RPC with one PostgreSQL transaction, invoked by the server action:
1. Validate `auth.uid()`, campaign membership, GM/token-owner authorization, token/scene/campaign linkage, type and bounded integer amount.
2. Lock the token row using `SELECT ... FOR UPDATE` and linked character row in a consistent locking order; avoid deadlocks with other HP actions.
3. Validate HP in both records and define the canonical source of truth. Never silently repair corrupt HP.
4. Compute damage/heal/set while locked, preserving existing bounds and temporary HP policy (current action does not process temporary HP).
5. Update token HP and only the `hp.current` JSONB path of the linked character using `jsonb_set`, not the complete JSONB document.
6. Raise an error to rollback **both** updates on any failure; return the new HP.
7. Explicitly review RLS and `SECURITY INVOKER` vs `SECURITY DEFINER`. If definer required, pin `search_path`, revoke PUBLIC EXECUTE and enforce membership/ownership in SQL. Audit role privilege and policies before rollout.
8. Switch both `damageToken` and `updateTokenHP` to one centralized RPC (absolute HP writes require an expected-current-value precondition). Prevent mixed legacy/new write paths during rollout.

## Verification required before applying
- Isolated DEV Supabase confirmed independent of production (project URL, database ID and credentials).
- Run two simultaneous damage actions (e.g. 20 HP, -3 and -4 => 13), healing, saturation at 0/max, linked character updates, malformed HP rejection, missing token, cross-campaign request, RLS GM/owner/nonowner, rollback failures, and unrelated JSONB field updates.
- Test 2 clients with Realtime enabled; verify emitted change events and rollbacks.
- Apply only after explicit migration review and rollback plan. Do not run against production or an unverified Vercel Preview backend.

This document intentionally contains **no executable migration** until schema/policies and character HP write paths are audited.
