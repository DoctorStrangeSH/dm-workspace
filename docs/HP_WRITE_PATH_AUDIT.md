# HP write-path audit — current main

Checkpoint: 2026-10-28. This is a static source audit, not a claim that live DEV or PROD behavior has been verified.

## Confirmed write paths

| Path | Current implementation | Consistency gap |
|---|---|---|
| Scene token HP setter | `src/lib/actions/tokens.ts:updateTokenHP` directly updates `tokens.hp_current` after authorization. | Does not update linked `characters.data_json.hp.current` and does not propagate to sibling tokens. PR #182 proposes routing it through combat, but remains open and is not in main. |
| Combat damage/heal/set | `src/lib/actions/combat.ts:damageToken` updates token row first, then separately reads the linked character and calls `update_character_data_cas`; failure triggers a best-effort conditional rollback of the token. | Not one transaction. A concurrent update can occur between reads/writes/rollback. It addresses one token and does not atomically update sibling linked tokens. |
| Character HP editor | `src/lib/actions/characters.ts:updateCharacterHP` reads character JSON and saves it through `update_character_data_cas`. | CAS protects against stale character JSON, but does not synchronize token rows or sibling tokens. |
| Generic character JSON writer | `updateCharacter` with `data_json` also requires expected JSON and calls CAS. | CAS avoids stale full-document overwrite, but cannot by itself coordinate token rows in the same transaction. Audit every caller and all direct SQL writers before rollout. |
| Character death save | `rollDeathSave` may set character HP to 1 and writes through the character CAS helper. | Does not update linked token HP in the same transaction. |
| Token creation | `createToken` inserts token HP supplied/normalized by the caller. | Insert is not transactionally coordinated with character HP or a concurrent level-up. Existing PR #160–#161 SQL draft is deliberately non-callable and not deployed. |
| Long rest / level up | Character actions include rest/level-up flows that modify character JSON. | Must inspect each exact writer and ensure it participates in the same DB transaction/locking contract before claiming complete HP consistency. |

## Required contract before implementation

1. Choose the character row as the canonical lock target for linked player-character HP. Every operation affecting HP or linked-token relationships must lock rows in one documented, consistent order (character first, then linked tokens ordered by stable ID).
2. In one PostgreSQL transaction, authorize campaign/user access, validate current linked-token set and pre-existing consistency, apply the intended HP calculation, and update character HP plus **all** sibling linked tokens. Fail closed on drift or partial relationship visibility; do not silently repair unknown data.
3. Coordinate token create/relink/unlink, character HP changes, combat damage/heal/set, death saves, long rest, level-up, and any direct database writer. A single RPC cannot provide global consistency while alternate writers bypass it.
4. Keep server-side authorization and RLS. No service-role bypass for normal user operations. RPC execute grants must be narrow and reviewed.
5. Add real DEV integration tests using two independently authenticated accounts/sessions and isolated disposable fixtures. Test both transaction orders and interleaved commits for: two concurrent damage calls (e.g. 3+4), damage vs heal/set, HP vs level-up/rest, HP vs token creation/relink, stale character CAS, sibling token propagation, existing drift rejection, and unauthorized/wrong-campaign requests. Assert before/after snapshots for character HP and every linked token.
6. The current test harnesses and SQL drafts are not evidence of a production-ready RPC. Confirm the deployed DEV function definition and migration history, run actual authenticated tests, inspect cleanup, then plan the PROD release with backup/rollback and explicit approval.

## Decision on open PRs

- **Do not merge #182 yet**: it improves one write path by routing it through `damageToken`, but it remains non-atomic and still omits sibling-token consistency.
- **Do not merge the stacked #160–#172 chain as-is**. Review the diffs against current main and extract only reviewed tests/docs into a small main-based PR when useful. Several PRs are stacked on old feature branches and describe uninstalled review SQL.
- Do not deploy review SQL or mutate Production while any alternate HP writer bypasses the agreed transaction contract.

## Current facts vs unknowns

- Confirmed from current `main`: the direct token setter still exists; combat uses separate token and character writes with best-effort rollback; character HP uses CAS independently.
- Not established by this source audit: exact deployed DEV/PROD function definitions, current migration drift, real two-user concurrency results, or Vercel deployment/Preview health. Verify these through live read-only inspection and guarded DEV tests before any rollout.
