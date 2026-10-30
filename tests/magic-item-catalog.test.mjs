import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  downloadCatalog,
  normalizeMagicItem,
  prepareImport,
  validateCatalog,
} from '../scripts/lib/magic-item-catalog.mjs'

// Shape captured from Open5e v2 /magicitems/, SRD 5.2 (CC BY 4.0).
const item = {
  key: 'srd-2024_adamantine-armor-breastplate',
  name: 'Adamantine Armor (Breastplate)',
  desc: 'While wearing this armor, any Critical Hit against you becomes a normal hit.',
  category: { name: 'Armor', key: 'armor' },
  rarity: { name: 'Uncommon', key: 'uncommon', rank: 2 },
  weight: '20.000',
  weight_unit: 'lb',
  cost: '0.00',
  requires_attunement: false,
  attunement_detail: null,
  document: { key: 'srd-2024', name: 'System Reference Document 5.2' },
}
const envelope = (...results) => ({ document: 'srd-2024', count: results.length, results })
const ref = 'abcdefghijklmnopqrst'
const backup = {
  projectRef: ref,
  fingerprint: 'a'.repeat(32),
  count: 1,
  rows: [{ key: 'existing' }],
}

test('preserves actual rarity, weight, attunement and provenance without a fabricated price', () => {
  const normalized = normalizeMagicItem({
    ...item,
    rarity: { key: 'very-rare' },
    requires_attunement: true,
    attunement_detail: 'by a Wizard',
  })
  assert.equal(normalized.data.rarity, 'very rare')
  assert.equal(normalized.data.weight, '20')
  assert.equal(normalized.data.attunement, true)
  assert.equal(normalized.data.attunement_detail, 'by a Wizard')
  assert.equal(normalized.data.cost, '')
  assert.equal(normalized.data.source_collection, 'magicitems')
  assert.equal(normalized.data.license, 'CC-BY-4.0')
})

test('refuses wrong source, ambiguous values, duplicates and incomplete catalogs', () => {
  for (const patch of [
    { document: { key: 'srd' } },
    { rarity: null },
    { rarity: { key: 'varies' } },
    { requires_attunement: 'false' },
    { weight: '-1' },
    { weight: 'NaN' },
    { weight_unit: 'kg' },
    { cost: '100' },
    { category: { name: 'Unknown' } },
    { key: 'invalid' },
  ]) {
    assert.throws(() => normalizeMagicItem({ ...item, ...patch }))
  }
  assert.throws(() => validateCatalog(envelope(item, item)), /Duplicate/)
  assert.throws(() => validateCatalog({ ...envelope(item), count: 2 }), /Incomplete/)
})

test('checks pagination origin, document, counts and cycles before accepting a download', async () => {
  const response = (data) => ({ ok: true, json: async () => data })
  for (const next of [
    'https://other.example/v2/magicitems/?document=srd-2024',
    'https://api.open5e.com/v2/items/?document=srd-2024',
    'https://api.open5e.com/v2/magicitems/?document=srd',
    'https://api.open5e.com/v2/magicitems/?document=srd-2024&limit=100',
  ]) {
    await assert.rejects(downloadCatalog(async () => response({ count: 1, results: [item], next })))
  }
  await assert.rejects(
    downloadCatalog(async () => response({ count: 2, results: [item], next: null })),
    /Incomplete/
  )
  await assert.rejects(
    downloadCatalog(async () =>
      response({ count: 1, results: [{ ...item, document: { key: 'other' } }], next: null })
    ),
    /source/
  )
  let calls = 0
  const source = await downloadCatalog(async () =>
    response(
      ++calls === 1
        ? {
            count: 2,
            results: [item],
            next: 'https://api.open5e.com/v2/magicitems/?document=srd-2024&page=2&limit=100',
          }
        : { count: 2, results: [{ ...item, key: 'srd-2024_second' }], next: null }
    )
  )
  assert.equal(source.results.length, 2)
})

test('planning requires matching explicit project and skips existing keys', () => {
  assert.throws(() => prepareImport(envelope(item), backup), /project/)
  assert.throws(() => prepareImport(envelope(item), backup, 'z'.repeat(20)), /mismatch/)
  const { plan } = prepareImport(
    envelope(item),
    { ...backup, rows: [{ key: item.key, name_ru: 'Сохранить' }] },
    ref
  )
  assert.equal(plan.expectedInsertCount, 0)
  assert.deepEqual(plan.skippedKeys, [item.key])
})

test(
  'generated import runs atomically in an isolated PostgreSQL fixture',
  { skip: process.env.CATALOG_TEST_POSTGRES !== '1' },
  () => {
    // CI's disposable PostgreSQL only; never uses app credentials or live Supabase.
    const sql = (input, succeeds = true) => {
      const r = spawnSync('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], {
        input,
        encoding: 'utf8',
      })
      if (succeeds) assert.equal(r.status, 0, r.stderr)
      else assert.notEqual(r.status, 0)
      return r.stdout.trim()
    }
    sql(`CREATE TABLE public.srd_items(key text PRIMARY KEY, name text NOT NULL, name_ru text, data jsonb NOT NULL, updated_at timestamptz DEFAULT now());
    INSERT INTO public.srd_items VALUES ('${item.key}', 'Original', 'Перевод', '{"custom":"preserve"}', '2026-01-01');`)
    const snapshot = () =>
      JSON.parse(
        sql(
          `SELECT json_build_object('projectRef','${ref}','count',count(*),'rows',json_agg(to_jsonb(t) ORDER BY key),'fingerprint',md5(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY key))) FROM public.srd_items t;`
        )
      )
    const before = snapshot()
    const hostile = {
      ...item,
      key: 'srd-2024_test',
      desc: "A quote ' and \\n and $catalog_import$; DELETE FROM public.srd_items; --",
    }
    const source = envelope(item, hostile)
    const prepared = prepareImport(source, before, ref)
    sql(prepareImport(source, { ...before, fingerprint: '0'.repeat(32) }, ref).sql, false)
    assert.equal(snapshot().count, 1)
    sql(prepared.sql)
    const after = snapshot()
    assert.equal(after.count, 2)
    assert.deepEqual(
      after.rows.find((r) => r.key === item.key),
      before.rows[0]
    )
    assert.equal(after.rows.find((r) => r.key === hostile.key).data.description, hostile.desc)
    sql(prepared.sql, false) // Stale backup refuses retry before any mutation.
    const retry = prepareImport(source, after, ref)
    assert.equal(retry.plan.expectedInsertCount, 0)
    sql(retry.sql)
    assert.deepEqual(snapshot().rows, after.rows)
  }
)
