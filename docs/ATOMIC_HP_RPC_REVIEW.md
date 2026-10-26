# Atomic token HP RPC: review and DEV validation checklist

The proposed SQL is in `docs/sql/apply_token_hp_atomic.REVIEW.sql`, **NOT** the deployable migration directory. It has not been executed against any database. Existing server actions still use the conservative compare-and-set path from #72.

## Blockers before use
- Verify columns, FK links, UUID types, member role values, token ownership and Supabase RLS policies against the deployed schema.
- Audit all code paths writing `tokens.hp_current` or `characters.data_json.hp`. Migrating one action while leaving other writers direct can still lose updates or diverge.
- Check the database function execution owner, search path, schema privileges, auth scheme, role revocations, default grants and RPC access to API roles.
- Assess legacy tokens and characters whose HP differ or are missing: proposed function intentionally rejects them.
- Decide whether temporary HP should absorb damage, and the intended behavior when token and character max differ; draft preserves basic HP only.
- Verify all JSON fields survive and that `jsonb_set` affects only `hp.current`.
- Confirm DEV project is independent of production before applying this SQL there.

## DEV tests required
1. Concurrent damage: starting at 20, -3 and -4 must result in 13, with linked character also at 13.
2. Concurrent heal and damage in randomized order: both events applied exactly once.
3. Clamp to zero and max; reject negative, null, huge, fractional and unknown-mode inputs.
4. Stale expected-current precondition must raise a conflict without modifying either row.
5. Cross-scene, cross-campaign, nonexistent token, unauthenticated, unrelated member denied.
6. DM, primary owner and additional owner authorized; non-member denied even if token owner is spoofed.
7. Missing/malformed linked character, inconsistent HP, foreign key mismatch cause rollback.
8. Concurrent unrelated JSONB character update retains unrelated keys.
9. Two clients: Realtime emits correct token and character values.
10. Repeated deployment and rollback of grants/RPC are understood.

## Integration order
After DEV checks, stage deployable migration in a separate PR and migrate BOTH `damageToken` and `updateTokenHP` to `rpc('apply_token_hp_atomic', ...)`. Keep server-side validation, error mapping and revalidation. Do not introduce runtime RPC dependency before migration is available. Never apply production migration or perform live mutation as part of this draft review.
