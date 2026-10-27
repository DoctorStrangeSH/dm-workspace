# Transactional creation of character-linked tokens — review contract

**Design only. Not installed in DEV or Production.**

## Race to eliminate

Current `createToken` reads character HP, then inserts a token in a **separate statement**. A concurrent level-up can update the character between those statements. This can produce a new stale token even though the application verified HP beforehand.

## Required transaction

1. Authenticate via `auth.uid()`, validate scene belongs to campaign, campaign membership, token owner rules, character ownership or owner-DM permissions.
2. If linked to a character, lock its `public.characters` row **FOR UPDATE** before reading HP. Hold this lock through token insertion and transaction commit. Validate numeric integral current/max and their bounds.
3. Enforce that a caller cannot set HP independently from linked character HP. Derive both HP fields from the locked character in SQL; preserve non-HP token fields after validation and authorization. For character-less monster tokens, use the separate existing pathway after input validation.
4. Insert into `public.tokens` inside the same transaction and return its id, or roll back completely on error. Check scene/campaign/character associations and player/DM privileges **inside the database**, not only the server action.
5. Require level-up and all linked-token HP writers to use compatible **character → token** locking. Row locking here does not protect against code that bypasses that protocol.
6. Creation races with unlinking, deleting, token ownership delegation and campaign edits must also be tested. Verify FK constraints and RLS before allowing `SECURITY DEFINER` and `EXECUTE` grants.

## Suggested API (not yet deployed)

`create_linked_token_atomic(p_scene_id uuid, p_character_id uuid, p_name text, p_x numeric, p_y numeric, ...) RETURNS uuid`

Keep optional metadata typed and allowlisted; do **not** accept caller-supplied character HP or arbitrary JSON for row insertion.

## Acceptance matrix

| Scenario | Expected |
|---|---|
| Create linked token from 47/47 HP | Token starts at 47/47 |
| Concurrent level-up and create | Token either created before level-up and then updated, or created after with new HP; never stale |
| Create 2 tokens concurrently | Both match character HP |
| Malformed character HP such as 'D101' | Error and no token |
| Cross-campaign character or scene | Denied |
| Nonmember / unauthorized player | Denied |
| Token creation conflicts with character deletion | Rollback or valid FK-consistent outcome |
| Concurrent combat change | No lost HP; consistent with shared lock protocol |
| Database failure after attempted insert | No partial result |

## Implementation gate

This document does **not** claim an atomic implementation. A safe SQL function requires exact schema inspection, a reviewed security model, tests against disposable DEV fixtures, and coordination with all older HP writers. Keep feature flags disabled and do not install an incomplete privileged RPC.
