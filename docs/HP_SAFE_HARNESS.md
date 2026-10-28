# Disposable DEV HP harness — preparation only

Based on main `36e406442b10324d9cadf70c1c84ae53d7684e5a`. Replaces the unsafe
single-token assumptions in stacked PRs #166–#172; does not merge that stack.
No manual Actions workflow is added. No migration, app writer or grant is changed.

## Current stop condition

**Do not run this against the installed HP RPC.** The audit records migration
provenance drift, token-first locking and missing sibling propagation. Resolve
those issues in a separately reviewed DEV-only migration and coordinate every
writer under `HP_ATOMIC_ROLLOUT_CONTRACT.md` before authorizing a mutating run.
Preparing this script or passing its mocked tests is not live DEV acceptance.

## Offline verification

`node --test tests/dev-hp-concurrency.test.mjs`

The suite injects a fake network adapter. It never contacts Supabase, signs in,
invokes a real RPC or requires real credentials. Importing the harness has no
side effects. There are no new npm dependencies.

## Fixture inventory for a future authorized DEV preflight

Prepare a local JSON file containing `campaignId`, `characterId`, integer
`startHP` and `maxHP`, `tokens: [{ id, sceneId }, ...]`, and `inventoryEvidence`.
Use at least two distinct linked token IDs. Both campaign and character must
have the `HP-DEV-TEST-` name prefix. Never use player data.

`inventoryEvidence` identifies a separate read-only inventory reviewed by the
operator with complete visibility of all tokens linked to this character.
Matching RLS-filtered results for two users **cannot prove** that hidden
siblings do not exist. The script compares both visible sets to the supplied
inventory but cannot independently certify that inventory. Freeze unrelated
fixture writers during this narrow damage test.

Use existing sessions for two different authenticated users, with known test
permissions. Supply `DEV_SUPABASE_URL` (exact pinned DEV host),
`DEV_SUPABASE_ANON_KEY`, `DEV_TEST_JWT_A` and `DEV_TEST_JWT_B` through the process
environment. Do not place credentials in files, commands, reports, or Git.
The harness performs no sign-in or refresh. Expired sessions fail closed.

After separate authorization for read-only DEV access:

`node scripts/test-dev-hp-concurrency.mjs --fixture <local-inventory.json> --report <new-local-report.json>`

This defaults to GET-only preflight. It checks both auth identities, names,
campaign/scene/character relationships, complete inventoried linked-token sets,
matching character JSON and HP snapshots. It does not call the HP RPC.

## Future mutating mode — remains blocked by current audit

Only after the migration, fixture, grants and writer-coordination gates are
reviewed and explicit permission is given, both `--allow-mutation` and
`DEV_HP_ALLOW_MUTATION=true` are required. Neither opt-in alone enables writes.
The CLI flag is accepted only as the final argument. Do not run it now.

That mode attempts exactly two concurrent damage requests (3 and 4) through
different linked tokens, without retries. It snapshots both users' views after
both requests settle, including when requests fail. It requires valid serialized
RPC return values, final HP `startHP - 7` in character and every token, unchanged
max/temp HP, unrelated character JSON and token relationships.

A local report path is reserved before any network request and cannot overwrite
an existing report. Reports contain full disposable character JSON: keep them
outside the repository and do not publish them. A process crash, timeout or
failed final snapshot can leave the commit outcome unknown. Independently
inspect all fixture rows before retrying. There is no automatic rollback,
cleanup, user creation, seed, schema write or Production mode.

After any attempted mutation, manually inspect and restore/remove every
disposable fixture row under separate authorization. A passed damage case is
only one case: authorization failures, stale set, damage/heal, creation/relink,
rest/level-up, unrelated concurrent JSON changes, repeated races, rollback and
Realtime acceptance remain required by the rollout contract. Concurrent HTTP
attempts alone do not prove the server transactions overlapped; retain server
timing/lock evidence in the later live verification.
