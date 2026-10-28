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
- Existing DEV dataset has **zero** characters owned by a player with a distinct DM member in the same campaign. Therefore the DM-path test **has not happened**.

## Remaining required gates
1. Create *disposable* DEV-only campaign and two real distinct authenticated test accounts, one DM and one player; use real session JWTs, not an arbitrary simulated identity. Verify the player's character is editable via this RPC by the campaign DM but not by an unrelated participant. Verify read policies and campaign boundaries.
2. From **two independent authenticated database/API sessions**, race an HP update against the class/subclass RPC (both execution orders, interleaved commits), then assert no HP, inventory, features or subclass changes were lost. A sequential transaction is NOT an adequate concurrency test.
3. Audit other full-JSON writers such as `updateCharacter`: this RPC alone cannot prevent stale clients from overwriting identity changes with an old whole-document snapshot. Add version/CAS protections or migrate writers before claiming full lost-update protection.
4. Verify clearing subclass (`p_subclass = NULL`), invalid class, wrong campaign, denied unauthorized identity, and no changes when rejected.
5. Review migration source, ensure no unexpected broad EXECUTE grants; test DEV schema drift, add follow-up server action, and only then plan PROD migration and UI deployment.

## Rollout note
The DEV function has been applied directly through SQL for verification. The SQL migration in #208 is the source-controlled release artifact; do not reapply manually without checking migration state.
