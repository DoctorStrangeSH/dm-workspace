# Atomic character identity RPC — DEV acceptance gate

Tracking: #207, #208. DEV project: `yoondivyeueyrtgeldja`. PROD: `klzziumdjpagqquihpks`. Do not run writes on PROD before the release gate.

## Verified in DEV (2026-10-28)
- `characters.data_json` is JSONB and table RLS enabled.
- `authenticated` has SELECT and UPDATE; invoker function honours existing RLS.
- `pg_proc.prosecdef = false`; anon cannot EXECUTE, authenticated can.
- Authenticated owner call within an explicit transaction changed wizard to fighter/champion and preserved original HP. ROLLBACK restored wizard and HP.
- Sequential HP patch (9 -> 7), then identity patch preserved new HP in the same transaction; ROLLBACK.
- Unknown auth identity and wrong campaign ID returned false.
- Invalid wizard/champion combination rejected with SQLSTATE 22023.
- Existing DEV dataset has no pre-existing character owned by a player with a distinct DM member, but **two qualifying DM/player membership pairs exist**. Created a disposable character inside a single transaction, switched to `authenticated` role with a simulated DM `request.jwt.claim.sub`, called the RPC, and confirmed class changed while HP and inventory stayed unchanged. Rolled back the transaction. This tests the DB RLS path under a simulated identity, **not** real JWT authentication.

## Remaining required gates
1. Confirm with **real signed DEV JWTs for two distinct accounts** (DM and player) that an authenticated DM can edit the player's character but an unrelated participant cannot. The simulated-role transaction passed, but is not equivalent to real session verification.
2. From **two independent authenticated database/API sessions**, race an HP update against the class/subclass RPC (both execution orders, interleaved commits), then assert no HP, inventory, features or subclass changes were lost. A sequential transaction is NOT an adequate concurrency test.
3. Audit other full-JSON writers such as `updateCharacter`: this RPC alone cannot prevent stale clients from overwriting identity changes with an old whole-document snapshot. Add version/CAS protections or migrate writers before claiming full lost-update protection.
4. Verify clearing subclass (`p_subclass = NULL`), invalid class, wrong campaign, denied unauthorized identity, and no changes when rejected.
5. Review migration source, ensure no unexpected broad EXECUTE grants; test DEV schema drift, add follow-up server action, and only then plan PROD migration and UI deployment.

## Rollout note
The DEV function has been applied directly through SQL for verification. The SQL migration in #208 is the source-controlled release artifact; do not reapply manually without checking migration state.

## Independent-session concurrency smoke (2026-10-28)

Created disposable DEV-only character, dispatched two `execute_sql` calls via `Promise.allSettled` with independent transactions/`SET LOCAL ROLE authenticated` and simulated owner JWT claim. HP writer updated `data_json.hp.current` to 7, held row lock via `pg_sleep(1.5)` then committed; identity writer called `update_character_identity_atomic` concurrently and committed. Both SQL calls returned successfully. Persisted state after both commits: class `fighter`, subclass `srd-2024_champion`, HP current `7`, inventory JSON intact. Deleted only the disposable fixture by matching both ID and test name; DELETE confirmed. This validates the exercised concurrent **row-level SQL patch** path, but **does not** validate the application’s legacy whole-document `updateCharacter` path or genuine signed JWT authentication. Reverse-order race and stale whole-document writer remain to be tested; do not claim end-to-end lost-update safety.
