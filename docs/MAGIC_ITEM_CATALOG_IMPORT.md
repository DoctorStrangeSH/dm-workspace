# Magic item catalog import

The old broad seed uses `/items/`, omits `/magicitems/`, and sends an ignored
`document__key` filter. Probes with a nonexistent key still returned 2322 magic
items. The supported `document=srd-2024` filter returned 760, all individually
verified as SRD 5.2. The original catalog has **440**, not 540, records: the
previous audit's 20 category counts sum to 440. No deletion explains that typo.

Do not rerun `seed-open5e.ts`: its upsert can reset translations and touches
unrelated catalogs. This dedicated importer never connects to a database.

## Preparation

1. Verify the target Supabase project name/ref; keep DEV and Production separate.
2. Download/validate the source with `node scripts/prepare-magic-items.mjs --out <dir>`.
   This is dry-run only. A retained source envelope can be supplied with `--source`.
   Pagination must retain origin/collection/document, stable count, unique keys,
   and complete results. Every item is checked against `srd-2024`; unknown shapes
   stop preparation. No other source is silently accepted.
3. Retain a full catalog backup from this read-only query, together with the
   verified `projectRef` in the resulting JSON object:

```sql
select jsonb_build_object(
  'rows', jsonb_agg(to_jsonb(t) order by key),
  'fingerprint', md5(string_agg(md5(to_jsonb(t)::text), '|' order by key)),
  'count', count(*)
) as backup from public.srd_items t;
```

4. `node scripts/prepare-magic-items.mjs --source <source.json> --baseline <backup.json> --project-ref <verified-ref> --out <plan-dir> --prepare-sql`
   generates `plan.json` and `import.sql`; it still makes no DB connection/write.
5. Review plan/source/attribution and the actual SQL. Confirm installed columns,
   unique key, constraints, triggers and RLS before applying with the verified
   project's SQL tool. The project comment is a routing aid, not database identity
   enforcement: the operator must bind the correct connector project explicitly.

## Write and verification

Apply in DEV first. SQL locks only `srd_items` briefly (3s lock/15s statement
timeout), refuses a changed baseline, inserts only absent keys with `ON CONFLICT
DO NOTHING`, checks insert count and fingerprints every preexisting row inside
the same transaction. It never updates existing rows/translations. No schema,
RLS, character, inventory, campaign, token, HP or migration-ledger changes.

Retain source hash, plan, full backup, execution result and independent readback.
Verify exact inserted rows against the prepared data, previous rows byte-for-byte
as JSONB (including timestamps/translations), total count, rarity distribution
and authenticated-role catalog SELECT. Repeat in Production only after DEV
verification and compatible UI release. Never treat a lost write response as a
failure: read back before retrying. A stale plan refuses retry; a newly prepared
plan skips all existing source keys and is idempotent.

On failure before COMMIT the transaction rolls back. After COMMIT, recovery is a
separate reviewed operation using the exact inserted-key manifest and stored row
contents. Remove only rows still matching this import if rollback is necessary;
never delete by prefix, recreate the table, replay a broad seed or overwrite later
edits. Existing backups are retained for manual recovery; this script emits no
automatic deletion. Players may already have copied items, so deleting catalog
rows does not undo player inventory and does not authorize altering it.

## Data and license

Source document endpoint `/v2/documents/srd-2024/` identifies Wizards of the Coast's
System Reference Document 5.2 and Creative Commons Attribution 4.0 (`cc-by-40`).
The app provides attribution at `/srd-license` and links from imported item details.
Each row retains source collection/document/URL/license. Descriptions remain in
English; no fabricated Russian translations, prices or mechanical bonuses.
`very-rare` becomes the existing UI's `very rare`; attunement remains a strict
boolean and its source detail is retained. Weight is validated in pounds.
All observed source costs were `0.00`; these mean unspecified price in this import,
not a free item. Any nonzero price or unknown rarity/category stops preparation.

New rows become searchable by existing actions. The page now supplies actual
type/rarity filter choices, reading catalog metadata in 500-row pages rather than
silently truncating at the Data API response cap. Initial search still returns
100 matches; use filters/search to narrow results. This is not full catalog
pagination or equipment automation.

Validation: `node --test tests/magic-item-catalog.test.mjs`. CI also executes the
generated transaction against a disposable PostgreSQL instance to verify stale
baseline refusal, insertion, conflict/translation preservation, hostile text,
rollback and repeat-run behavior. Never enable that fixture against a live DB.
