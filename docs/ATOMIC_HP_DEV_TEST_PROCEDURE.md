# DEV atomic HP test procedure (no live fixture mutation yet)

This checklist is deliberately separated into **read-only preflight** and **state-mutating integration tests**.

## Stage A: read-only preflight
Run `docs/sql/atomic_hp_dev_readonly_preflight.sql` against confirmed `dm-workspace` DEV. Confirm:
- Required columns, foreign keys, enum role values and HP JSONB expectations.
- RLS policies, helper function ownership and privileges.
- `apply_token_hp_atomic` is absent until reviewed migration is installed.
- Document permission mismatch between role `dm` and campaign owner.

## Stage B: isolated write tests — do not run without deliberate authorization
1. Use new disposable fixture campaign, scene, character and token and two dedicated test accounts; never reuse existing gameplay records.
2. Deploy the reviewed SQL to the DEV project only after approval, ensuring `SECURITY DEFINER` grants and RLS have been audited.
3. Exercise authenticated owner, delegated owner, DM, nonmember and anonymous access and cross-campaign failures.
4. Fire simultaneous damage (20 - 3 - 4 = 13), mixed damage/heal, set with stale expected HP, and failure rollback.
5. Confirm `characters.data_json` unrelated keys are retained and realtime token broadcasts are received.
6. Verify all character HP edits, token HP edits, death save recovery and long rest use a coordinated write mechanism.
7. Clean up ONLY the disposable fixtures after tests; capture evidence in PR.
8. Promotion to production is a separate reviewed operation.

## Known blockers
- Current SQL lives in `docs/sql/apply_token_hp_atomic.REVIEW.sql`; it has never been applied, and code still calls legacy actions.
- Current character actions perform whole-document updates. Optimistic CAS mitigates some races but does not give transaction-wide coordination.
- Additional ownership and DM membership vs owner semantics must match final RLS.
