# HP DEV reconciliation — review plan, not a migration

Checkpoint: 2026-10-28. Source baseline main
`36e406442b10324d9cadf70c1c84ae53d7684e5a`. No SQL is applied by this document.
No installed RPC, manual workflow, seed, fixture creation, schema repair, grant
change or Production operation is authorized by this plan. No new live DEV
catalog query was executed during this source review.

## Findings that change the next step

1. The current main audit records an installed DEV HP RPC outside the reported
   six-migration history, token-first locking, and missing sibling propagation.
   Those are historical read-only findings, not a fresh catalog snapshot.
2. The combat SQL at PR #164 head
   `dd89b98415735a47e6974dee83fc4ca10f90eceb` is **executable if applied**:
   `docs/sql/apply_token_hp_atomic.REVIEW.sql` uses `CREATE OR REPLACE FUNCTION`,
   grants EXECUTE to `authenticated`, and ends with `COMMIT`. Its REVIEW filename
   and comments do not disable it. Never copy/apply it as a safe disabled draft.
3. The test named `all SQL drafts remain disabled and never grant callers EXECUTE`
   at PR #165 head `6e55740f672af521932c8676da8ba14dcad6d3dc` loops over only
   creation and level-up SQL. It excludes combat SQL. Its title does not prove
   that the combat RPC is disabled.
4. The #164 draft takes character and sibling locks before checking actor
   permissions. The contract requires authorization before sensitive locks and
   revalidation after locking. Review unauthorized lock contention as well as
   data access; do not assume a later permission rejection makes this harmless.
5. Main still contains independent token writes, combat's multi-step token/CAS
   path, and the whole-document character CAS helper. Installing a sibling-aware
   combat RPC alone does not coordinate these writers.
6. #238's original report was only written after the run. The revised harness
   journals and syncs the baseline plus intent before any mutating request.
   Offline tests establish runner behavior only, not database correctness.

## Evidence to collect next, read-only and DEV-scoped

Use only the previously identified DEV project `yoondivyeueyrtgeldja`; verify its
identity before querying. Never discover or inspect Production as a fallback.
Collect metadata in a read-only transaction with a short statement timeout.
Do not invoke functions merely to inspect them. Do not fetch user sessions,
credentials, or player rows. Keep query time, project identity and source SHA
with the result; a prior audit is not a substitute for the current state.

| Evidence | Read-only source | What it must establish |
| --- | --- | --- |
| Migration history | DEV migration list; compare with exact `supabase/migrations` filenames at main | Missing, extra and mismatched migrations, including non-HP changes; never mark an unknown migration as applied |
| HP overloads and complete definitions | `pg_proc`, `pg_namespace`, `pg_get_functiondef`, `pg_get_function_identity_arguments` | Exact callable signatures, source text, owner, security mode and `search_path` |
| Effective execution rights | Function ACL plus role inheritance/effective privilege inspection | PUBLIC/anon/authenticated/service roles, inherited rights and overload exposure; no grant changes |
| Table shape | Catalog columns, defaults, nullability, keys, foreign keys, indexes for tokens/characters/scenes/campaign membership/owners | Actual types and relationship enforcement; confirm that filters such as `token_owners.campaign_id` really exist |
| Policies and privileges | `pg_policies`, table ACL/effective rights and RLS flags | Who can read/write HP and change links directly; whether any alternate route bypasses the future protocol |
| Triggers and dependencies | `pg_trigger`, `pg_get_triggerdef`, related function definitions | HP/link writers, broadcasts, trigger-induced locks and all dependencies on the existing signature |
| Existing character functions | Definitions/ACL of `update_character_data_cas` and `update_character_identity_atomic` | Whole-JSON write semantics, non-HP preservation and interactions with future locks |

An ordinary SELECT can call a mutating function. Limit inspection to reviewed
catalog expressions; do not call `apply_token_hp_atomic`, run scripts or dispatch
workflows under the label of a read-only check. A missing tool or denied access
is a blocker to that evidence, not permission to use another project.

## Design decisions required before authoring deployable SQL

- Select the canonical character lock and require it for every linked-token set
  change. Relinking must lock both old and new characters in deterministic ID
  order, then relevant tokens in deterministic ID order, then revalidate. Include
  standalone-to-linked transitions and deletion; a token-only lock is insufficient.
- Define membership/DM/primary/additional-owner authorization from verified
  schema. Reject unauthorized actors before acquiring cross-character locks;
  revalidate relationships and authorization after locks. Do not grant ownership
  of a sibling merely because one token can be edited.
- Review a least-privilege security model that can update all required siblings
  despite partial caller visibility. Prefer invoker where sufficient; if a
  definer is necessary, justify its owner, empty search path, qualified names,
  explicit actor checks and narrow signature-specific execution rights.
- Fail on malformed HP, foreign-campaign siblings, pre-existing drift, changed
  linkage or stale preconditions. Preserve unrelated JSON keys and temp/max HP
  according to the explicit operation contract. Do not silently reconcile data.
- Close bypasses: token setter, combat damage/heal/set, character HP, natural-20
  death save, rest, level-up, token create/relink/unlink/delete, generic JSON CAS,
  direct SQL and triggers. Route or reject HP edits through every old interface.
  Specify which non-HP CAS operations remain valid and how stale JSON is handled.
- Determine the DEV-only cutover and rollback while keeping legacy writers from
  running concurrently. Rollback must not re-enable the known unsafe RPC or
  restore stale fixture HP automatically. Preserve prior definitions/ACL evidence
  privately and review dependencies before any replace/drop.

## Reviewable delivery sequence

1. Collect and reconcile the DEV metadata above without changing it. Record
   unknowns explicitly. Do not repair migration history to manufacture parity.
2. In a separate main-based change, implement and test the coordinated protocol
   against an isolated local database with the verified relevant schema, RLS and
   triggers. Use runtime SQL tests, not regex fragments, for authorization,
   transaction rollback, lock ordering and writer bypasses. No live database is
   needed for this development stage.
3. Only after review, generate a migration with the project's supported Supabase
   CLI (`migration new`, after checking its help/version); do not invent a file
   timestamp or add the existing REVIEW SQL directly to auto-applied migrations.
   Include signature-specific rights, bounded apply/lock timeout, preconditions,
   repeatability policy and reviewed rollback. Local success is not DEV delivery.
4. Obtain explicit permission for the concrete DEV migration and disposable
   fixtures, then verify installed definitions and migration history after apply.
   Production remains outside this stage.
5. Only after those gates, authorize an independent-user live DEV suite. Use a
   separately verified complete fixture inventory, durable journals and actual
   server overlap evidence. Run all rollout-contract cases, including failures,
   cross-writer races and Realtime; the 3+4 damage case alone is insufficient.
6. Integrate app callers after verified DEV availability and tests. Preview/app
   acceptance, backups, rollback and explicit Production approval remain separate
   release gates. Neither a green CI nor a merged preparation PR opens them.

## Sources checked

- Repository: `docs/HP_WRITE_PATH_AUDIT.md`, `docs/HP_ATOMIC_ROLLOUT_CONTRACT.md`,
  `src/lib/actions/{tokens,combat,characters}.ts`, and the tracked character CAS
  and identity migrations at the baseline SHA.
- [Exact #164 combat draft](https://github.com/DoctorStrangeSH/dm-workspace/blob/dd89b98415735a47e6974dee83fc4ca10f90eceb/docs/sql/apply_token_hp_atomic.REVIEW.sql)
- [Exact #165 static tests](https://github.com/DoctorStrangeSH/dm-workspace/blob/6e55740f672af521932c8676da8ba14dcad6d3dc/tests/atomic-hp-sql-lock-order.test.ts)
- [Supabase function security and privileges](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL lock ordering and deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS)

Current decision: preparation only. Keep #163–#172, #182 and #238 unmerged until
their own review gates are satisfied. This plan does not authorize a merge or a
deployment, and does not claim the existing DEV RPC is safe.
