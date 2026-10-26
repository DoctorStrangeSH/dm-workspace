# Safe recovery of malformed character HP

## Background
Some character cards displayed literal strings such as `D101` or `null`. The UI now rejects invalid HP for display and server actions validate incoming values. This does **not** restore already-corrupted records.

The precise origin of every bad record is not yet confirmed. A suspected path is string concatenation during level-up (`"10" + 1 === "101"`). Also review token↔character HP synchronization in PR #29 before declaring the root cause fixed.

## Recovery procedure (no automatic writes)
1. Verify that the Vercel Preview points to an isolated DEV Supabase project (compare **project IDs**, not secrets).
2. Reproduce with a dedicated test character in DEV only; export a backup of the test character's full original `data_json`.
3. Inspect `data_json.hp` without modifying it. Write down class, level, CON modifier, current/max/temp HP, and the last known legitimate HP if available.
4. Do **not** infer correct HP from a malformed string like `D101`. Ask the DM/player for the correct original or agreed values, checking session notes or prior backups.
5. Repair a **copy** of the affected test character in isolated DEV using validated integer HP (max > 0, 0 <= current <= max, temp >= 0). Keep a copy of the pre-repair value and an audit entry.
6. Verify the character sheet, card, initiative/linked token sync, short/long rest and level-up; test DM and player roles.
7. For any real-player record, obtain explicit approval of the proposed values and a verified backup before a separately reviewed production repair. Never run bulk fixes based on guessed HP.

## Remaining engineering work
- Review ALL HP write paths, particularly token HP synchronization and level-up/long rest.
- Add end-to-end tests only against verified DEV Supabase using disposable test characters.
- Consider a DM-facing correction screen with confirmation and an audit log after data ownership and permissions are reviewed.
