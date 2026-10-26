# DEV security audit — atomic HP RPC

2026-10-26 — read-only catalog inspection on confirmed DEV project `dm-workspace`. Production project `dm-workspace-prod` untouched.

## Confirmed findings
- `public.apply_token_hp_atomic` does **not currently exist** in the queried DEV catalog. The review SQL remains unapplied.
- `public.is_campaign_dm`, `public.user_campaign_ids` and `public.user_dm_campaign_ids` are existing `SECURITY DEFINER` functions owned by `postgres`.
- All three have EXECUTE granted to PUBLIC, anon and authenticated, per current `pg_proc.proacl`. This is an audit finding, **not proof of an exploit**; inspect individual definitions and test effective access before proposing changes.

## Risk assessment
- A new `SECURITY DEFINER` RPC owned by a privileged role could bypass table RLS and must enforce campaign membership, ownership and scene linkage inside the function.
- The reviewed prototype contains explicit permission checks and a fixed search_path, but granting authenticated EXECUTE requires a dedicated adversarial test pass. Ensure that no user-controlled SQL identifiers, untrusted dynamic SQL or privilege escalation are introduced.
- Locking token and character rows only serializes cooperating writers. Existing UI/server writes to HP or entire `characters.data_json` must be audited and migrated together.
- The review prototype has **not** been executed against DEV. CI success does not constitute an SQL authorization or concurrency validation.

## Next gate
Review existing helper function definitions and role grants; inspect all HP write paths, then promote a reviewed SQL migration only with disposable DEV fixtures and tests for anonymous, owner, DM, additional owner and cross-campaign access. Never execute on production without a separate decision.

