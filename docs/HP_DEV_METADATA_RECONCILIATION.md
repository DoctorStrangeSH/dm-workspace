# HP DEV metadata reconciliation — 2026-10-28

**Decision: keep HP runtime testing and SQL deployment blocked.** Fresh read-only
DEV inspection confirms migration-history drift, uncoordinated write paths and
the installed HP RPC's token-first/single-token behavior. It also exposes a
missing-key validation gap in that function. No migration repair or HP test was
performed. Production was neither queried nor changed.

## Scope and evidence

- DEV identity: project `dm-workspace`, ref `yoondivyeueyrtgeldja`, status
  `ACTIVE_HEALTHY`; database PostgreSQL 17.11 (reported project build
  `17.11.0.003`). The known DEV ref was checked directly; no other project was
  used as a fallback.
- Source baseline: main `36e406442b10324d9cadf70c1c84ae53d7684e5a`, containing
  **15** tracked migration files. Preparation PR #238 was separately at
  `586d18c378721dc47b58769c64e6be3df46c0d2d`; it is not merged into this baseline.
- Three catalog batches captured at 10:16:48, 10:17:37 and 10:18:15 UTC, plus a
  constant-expression check at 10:20:32 UTC and a ledger text scan at 10:24:39 UTC
  (13:16–13:24 Moscow time). Each used
  `REPEATABLE READ READ ONLY` and a local 5–10 second statement timeout. Every
  result reported `transaction_read_only = on`. These are separate snapshots,
  not one global atomic snapshot.
- Inspected function definitions/ACL, six table shapes, constraints/indexes,
  table and column privileges, 30 policies, 95 triggers (88 internal FK triggers,
  seven custom triggers), relevant role membership, catalog dependencies and a
  bounded scan of public routine source. No player rows, user sessions or
  credentials were selected. Application RPCs were not invoked.
- [Exact inspection SQL](verification/hp_dev_readonly_catalog_queries.sql)
  contains catalog reads and the constant expressions only. It is not a
  migration or an automatic runner. Full returned metadata and a SHA-256
  manifest were retained locally outside the checkout in
  `audit-evidence/hp-dev-2026-10-28/`; they are not published in this repository.

Local evidence-file SHA-256 fingerprints:

| File | SHA-256 |
| --- | --- |
| `functions.json` | `1217e3ae60a84aea9145a6eb1b497bcc6d9fe330fe75655960d67c60278634d8` |
| `schema.json` | `145e1f17a01c413d3ba305aa5102671ce3dc6f30d0e3023f72dcd076dbce6a2a` |
| `relations.json` | `fe51a8d3d51daffaa28a43e6bf8fba2a690ac8c77b339b6085c11a730992cc39` |
| `null-guards.json` | `c1a4d70c937fc10dd6d1ba4158dd4c1465ff9e2628a8a805ec0f35d6adeb557c` |

## Migration history is not the installed schema

DEV reports only these six ledger entries. Their descriptive names correspond
to six tracked PR37 migrations, but **their version numbers differ**:

| DEV version | DEV name | Repository version |
| --- | --- | --- |
| `20261027164525` | `pr37_realtime_broadcast_authorization` | `20261027000100` |
| `20261027164616` | `pr37_private_handout_storage` | `20261027000200` |
| `20261027164626` | `pr37_private_music_storage` | `20261027000300` |
| `20261027164642` | `pr37_private_scene_maps_storage` | `20261027000400` |
| `20261027175834` | `pr37_fix_private_scene_maps_object_name` | `20261027000500` |
| `20261027183134` | `pr37_revoke_broadcast_trigger_rpc_execute` | `20261027000600` |

Each ledger entry contains one recorded statement; statement fingerprints were
captured. Descriptive correspondence is not verified SQL-content equivalence.
No recorded DEV version exactly matches any of the 15 repository versions.
This does **not** mean all 15 effects are absent or should be replayed.

The other nine repository migrations (the 20261025 anonymous-grant change and
eight 20261028 migrations) have no corresponding named ledger entries in this
snapshot. Yet `update_character_data_cas` and `update_character_identity_atomic`
already exist, and anonymous table DML on the six inspected tables is revoked.
The follow-up scan found none of the literal HP/CAS/identity routine names in
any of the six recorded statement texts. It does not reconstruct unrecorded
history or exclude dynamically assembled DDL.
Thus absence from the ledger is not evidence of absence from the installed
schema. HP itself has no tracked migration in this baseline and is callable in
DEV. Do not run a blind migration replay or mark history entries as applied.

## Installed routines and effective rights

All three selected installed routines are owned by `postgres` with an empty
`search_path`. `postgres` has `BYPASSRLS` (it is not a superuser). No overloads
of the selected HP name were found beyond the signature below. Neither
`create_linked_token_atomic` nor `level_up_character_tokens` was found under
those exact names in `public`; that is not a claim about every possible name.

| Routine | Security mode | anon EXECUTE | authenticated EXECUTE | service_role EXECUTE |
| --- | --- | --- | --- | --- |
| `apply_token_hp_atomic(uuid,uuid,integer,text,integer)` | DEFINER | No | Yes | No |
| `update_character_data_cas(uuid,uuid,jsonb,jsonb)` | INVOKER | No | Yes | Yes |
| `update_character_identity_atomic(uuid,uuid,text,text)` | INVOKER | No | Yes | Yes |

ACL expansion found no PUBLIC EXECUTE for these routines. The inspected anon,
authenticated and service_role roles have no role memberships. Effective
privileges were checked, not inferred solely from ACL text. These observations
do not establish that an ordinary request is authorized for a particular row.

The installed HP body:

1. Resolves `auth.uid()` and validates request arguments.
2. Locks the selected token, **then** checks membership/DM/token ownership.
3. Locks the linked character, checks selected-token/character HP and expected HP.
4. Updates only `tokens WHERE id = v_token.id` and the character's HP JSON.

It does not lock/update all siblings, and permission rejection comes after the
first sensitive row lock. The required character-first/global writer protocol
is absent. Its body fingerprint (`md5(prosrc)`) is
`01f8ad6170dfe7fbccdece30ec96bcd8`; the full returned definition is in the local
evidence. Reading that definition did not execute the routine.

### Missing JSON keys can skip rejection

The type guard uses comparisons such as
`jsonb_typeof(v_char_hp -> 'current') <> 'number'`. A missing key produces SQL
NULL. In the installed body, the subsequent length/range/consistency checks can
also be NULL; a PL/pgSQL `IF NULL` does not enter the exception branch.
`jsonb_set(..., '{hp,current}', ..., false)` does not create an absent key.

The constant-expression batch returned:

| Character JSON | Type guard | Consistency guard against token 20/20 | JSON after patch to 13 |
| --- | --- | --- | --- |
| `{}` | NULL | NULL | `{}` |
| `{"hp":{"max":20}}` | NULL | NULL | `{"hp":{"max":20}}` |
| `{"hp":{"current":20}}` | NULL | NULL | `{"hp":{"current":13}}` |
| `{"hp":{"current":20,"max":20}}` | FALSE | FALSE | `{"hp":{"current":13,"max":20}}` |

This confirms the expression semantics and exposes a fail-open path in the
installed source: malformed/missing HP can pass those guards while the token
write proceeds and the character remains incomplete or unchanged. **The RPC
was not called**, no malformed fixture was created, and no existing malformed
player record was searched for. This is not end-to-end execution evidence.
The replacement needs explicit null-safe required-key/type checks and runtime
rollback tests for each missing-key case.

## Shape, policies and triggers constrain the replacement

- `tokens.hp_current`/`hp_max` are nullable integers;
  `characters.data_json` is non-null JSONB with `{}` as its default. The catalog
  has no HP-range/required-HP CHECK constraint on these two tables. A future
  function must validate its inputs and existing state explicitly.
- `token_owners.campaign_id` exists. However, the inspected FKs link campaign,
  scene, character and token independently; they are not composite FKs proving
  that all referenced records share one campaign. Revalidate relationships;
  never treat a same-campaign filter as proof that foreign siblings cannot exist.
- There is no captured index with leading `tokens.character_id`. Assess a
  sibling-lookup index and locking behavior on the verified schema locally; no
  live execution plan or performance benchmark was run.
- RLS is enabled, not forced, on all six inspected tables. Authenticated users
  have table and column UPDATE privileges, including token HP/link fields and
  character JSON. Policies permit token-owner/DM updates and character-owner/DM
  updates subject to their predicates. There is no HP-column restriction in
  these policies. These catalog facts leave authorized direct writes outside a
  new combat RPC; a new function alone cannot enforce the global invariant.
- Anonymous SELECT grants exist, while anonymous INSERT/UPDATE/DELETE/TRUNCATE
  are absent on these tables. SELECT grants alone do not establish anonymous
  row visibility: RLS still applies. No anonymous request was attempted.
- `token_owners` has no UPDATE policy in this snapshot, despite the table grant;
  do not mistake a table privilege for permission to change rows.
- The three policy helpers resolve membership or campaign ownership under
  SECURITY DEFINER. The DM helpers use `campaigns.owner_id`, not an arbitrary
  membership row marked `dm`. Authorization tests must reflect actual semantics.
- Tokens have timestamp and Realtime broadcast triggers; characters have only
  the timestamp custom trigger. No captured custom trigger coordinates HP.
  FK actions include character deletion setting `tokens.character_id` to NULL,
  and scene/campaign deletion cascading to tokens. Those implicit link changes
  belong in the lock/cutover design too.

Catalog dependencies for the three selected routines list their schema and
PL/pgSQL language, with no captured incoming dependency. This is **not** proof
that no callers exist: string-form PL/pgSQL, dynamic SQL and application clients
are not exhaustively represented by `pg_depend`. The bounded public source scan
matched the HP routine, the two character routines and token broadcasting; it
does not exclude dynamic, external or other-schema writers.

## Next safe work

1. Build an isolated local PostgreSQL fixture from the captured relevant shape,
   policies, helpers and triggers. Do not seed it from player rows or connect
   its test runner to a remote URL. Record which surrounding schema is omitted.
2. Design the coordinated character-first transaction boundary for combat,
   character JSON/HP, level-up/rest/death saves, token creation/relink/deletion
   and direct writes. Include null-safe validation, relationship revalidation,
   all sibling updates and explicit authorization before sensitive locks.
3. Prove it locally with executable SQL/independent-connection tests, including
   the new missing-key cases, unauthorized lock attempts, foreign siblings,
   stale CAS, rollback and link-set races. Static text checks and #238's mocked
   transport tests are insufficient database acceptance.
4. Reconcile the migration ledger with installed effects using separately
   reviewed evidence. Only then prepare a CLI-generated, reviewed DEV migration
   with preconditions and rollback; do not apply or repair anything now.

Keep #163–#172 and #182 unmerged/unapplied. #238 remains a preparation Draft;
this catalog checkpoint does not authorize its mutating mode. Production
inspection, rollout and app acceptance remain separate work requiring their
own evidence and authorization.
