# Atomic HP rollout contract

Status: design and acceptance criteria only. No SQL here is deployed or authorized for Production.

## Canonical state and transaction boundary

For a player character with one or more scene tokens, character HP and every linked token's HP must change as one PostgreSQL transaction. An operation must either commit all state changes or commit none.

The character row is the canonical lock target. Every operation that can mutate linked HP or the linked-token set must acquire locks in the same order:

1. Resolve and authorize actor, campaign, scene and requested target without trusting client-provided relationships.
2. Lock the character row `FOR UPDATE` when a character is linked.
3. Lock all linked token rows in deterministic `ORDER BY id` order.
4. Revalidate scene/campaign/character relationships and HP consistency after locks are held.
5. Calculate the new value from the locked current state (never from a stale client snapshot), clamp according to the operation's rules, and update character JSON plus every linked token.
6. Return a typed conflict/authorization/validation error and make no changes if any invariant fails.

For standalone NPC tokens with no character, use a separate transaction path that locks the token row and enforces the same authorization and bounds rules.

## Operations that must join the protocol

- Combat damage, healing and set-HP.
- Direct token HP editor/action.
- Character-sheet HP editor.
- Death-save natural 20 healing to 1 HP.
- Long rest and level-up HP transitions.
- Linked token creation, relinking, unlinking, and deletion if it affects the set of linked rows.
- Any SQL function, trigger, administrative action, or alternate server action that writes `tokens.hp_current`, `characters.data_json.hp`, or HP max values.

No runtime caller should depend on a new RPC until the matching migration is installed and verified in DEV. No old writer may remain able to bypass the protocol once it is enabled for linked characters.

## Drift and retry policy

- If linked token HP is already inconsistent with character HP before an operation, fail closed with a conflict; do not guess which row is correct or silently repair it.
- If the token link changes between initial read and lock, abort and ask the client to retry.
- Use deterministic lock ordering to avoid deadlocks. Handle serialization/deadlock errors as safe retryable conflicts, not as success.
- Preserve unrelated JSON keys when patching `data_json`; do not replace the whole JSON from stale client state.
- Authorization must be checked inside the RPC using `auth.uid()`, campaign membership/ownership, and correct scene/campaign relationships. Review `SECURITY DEFINER`, `search_path`, function ownership, RLS interactions, and EXECUTE grants. Do not grant to `anon` or expose service-role credentials.

## Required DEV verification

Use only disposable DEV campaign, scene, character and tokens, and two independently authenticated test users with known permissions. Snapshot character JSON and all linked token rows before/after every test.

1. Two concurrent damages from 20 by 3 and 4 result in 13 everywhere, with each operation applied exactly once.
2. Concurrent heal+damage, set+damage, and HP+long-rest/level-up have valid serialized outcomes; no lost update or stale overwrite.
3. HP change concurrent with linked-token create/relink/unlink cannot create a missed sibling or inconsistent snapshot.
4. Existing drift, missing linked character, foreign campaign/scene, stale expected data, malformed/overflow/fractional values and invalid operation mode fail without partial mutation.
5. Owner, additional authorized owner and DM succeed only as intended; non-member, wrong owner, unauthenticated actor and cross-campaign requests fail.
6. Concurrent unrelated character JSON updates preserve unrelated fields.
7. Verify Realtime emits committed values only and no partial state.
8. Run repeated migration/apply checks and confirm grants/rollback. Review server action error mapping and UI retry behavior.

Tests must use independent real authenticated sessions and overlapping requests; sequential SQL or unit tests of string fragments do not satisfy this gate. Record fixture IDs and outcomes without logging JWTs or passwords.

## Release gates

- [ ] All HP writers inventoried against current `main`; no uncoordinated writer remains.
- [ ] RPC and migration reviewed for actual schema, RLS, lock order, ownership, grants and rollback.
- [ ] Disposable DEV migration applied; live DEV migration history and function definition verified.
- [ ] Independent two-session concurrency suite passes all required cases.
- [ ] Application callers ported only after DEV RPC is installed and tested.
- [ ] CI, unit/security tests, and Preview using DEV config pass; manually verify GM/player/mobile and Realtime flows.
- [ ] Backup/restore and rollback procedure verified before Production release.
- [ ] Explicit approval before Production migration or data mutation.

Current decision: keep #182 and the stacked #160–#172 SQL/test drafts open for review; do not merge or apply them as a stack. Extract a clean main-based implementation only after DEV test prerequisites are ready.
