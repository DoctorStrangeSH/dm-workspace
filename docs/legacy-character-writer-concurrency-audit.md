# Legacy character JSON writers — concurrency audit

Related: #207 (atomic identity), #208 (SQL RPC), #210 (server action), #209 (PR cleanup).

## Confirmed unsafe pattern

`src/lib/actions/characters.ts` contains `saveCharacterData` performing `.update({ data_json: data })` without a version / expected-state check. Other actions first load `data_json`, mutate their local copy, then save the **whole JSON document**. Concurrent identity changes made through #208 can therefore be overwritten by stale copies, even though #208's own class/subclass update is atomic.

The generic `updateCharacter({ data_json })` also accepts and overwrites the full JSON object. It independently needs concurrency protection.

### Call sites in main audited 2026-10-28

`saveCharacterData` is called from approximately 16 sites in this file, including:
- `updateCharacterHP` (HP)
- `rollDeathSave` and reset flow
- spells and spell slots
- inventory and currency
- level-up / other character mutations

Do **not** treat merely making the identity RPC atomic as resolving this risk.

## Required solution and acceptance gates

1. Pick a consistent concurrency protocol: server-side narrow JSONB field mutations for independent operations; and/or optimistic CAS for full-document transformations using an expected revision/snapshot. Reject or retry stale writes rather than silently overwriting newer updates.
2. Preserve existing RLS and owner/DM access checks. Avoid SECURITY DEFINER without fully reviewed authorization.
3. Protect generic `updateCharacter` full-JSON saves too; do not update HP-only while leaving spell or inventory writers unsafe.
4. For HP, validate current/max/temp and linked map-token synchronization before changing semantics; existing #72–#101 and #147–#182 PRs address intertwined HP synchronization issues.
5. DEV tests with two genuine authenticated sessions for: class vs HP, class vs inventory, class vs spells, death save vs HP, and stale generic JSON update. Assert one write is safely rejected/retried or both independent fields survive. Test both execution orders.
6. Only then connect class editor UI; confirm class changes don't silently recalculate HP or spells.
7. Rollout: DEV first, audit migration status, CI green, then PROD separately. No third Supabase project.

## Existing passing narrower tests

Two independent SQL transactions with **narrow** row-level JSONB updates passed in both orders on disposable DEV fixtures (#208 verification document). Those tests do not cover stale whole-document saves.
