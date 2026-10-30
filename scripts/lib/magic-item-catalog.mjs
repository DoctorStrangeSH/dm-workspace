import { createHash } from 'node:crypto'

export const SOURCE_URL = 'https://api.open5e.com/v2/magicitems/?document=srd-2024&limit=100'
export const DOCUMENT = 'srd-2024'
const rarities = new Map([
  ['common', 'common'],
  ['uncommon', 'uncommon'],
  ['rare', 'rare'],
  ['very-rare', 'very rare'],
  ['legendary', 'legendary'],
  ['artifact', 'artifact'],
])
const categories = new Set([
  'Armor',
  'Weapon',
  'Wondrous Item',
  'Rod',
  'Potion',
  'Ring',
  'Staff',
  'Wand',
])
function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}
function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeMagicItem(item) {
  requireValue(object(item), 'Invalid item')
  requireValue(item.document?.key === DOCUMENT, 'Wrong source document')
  requireValue(
    typeof item.key === 'string' && /^srd-2024_[a-z0-9-]{1,100}$/.test(item.key),
    'Invalid item key'
  )
  requireValue(
    typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 300,
    'Invalid name'
  )
  requireValue(typeof item.desc === 'string' && item.desc.length > 0, 'Missing description')
  requireValue(categories.has(item.category?.name), 'Unknown category')
  requireValue(rarities.has(item.rarity?.key), 'Unknown rarity')
  requireValue(typeof item.requires_attunement === 'boolean', 'Invalid attunement')
  requireValue(
    item.attunement_detail == null || typeof item.attunement_detail === 'string',
    'Invalid attunement detail'
  )
  requireValue(
    item.weight_unit === 'lb' &&
      typeof item.weight === 'string' &&
      /^\d+(\.\d+)?$/.test(item.weight) &&
      Number.isFinite(Number(item.weight)),
    'Invalid weight/unit'
  )
  // Open5e currently supplies 0.00 for every magic item, not a market price.
  // Refuse changed pricing semantics rather than inventing currency or a price.
  requireValue(
    typeof item.cost === 'string' && /^0+(\.0+)?$/.test(item.cost),
    'Review nonzero cost before importing'
  )
  return {
    key: item.key,
    name: item.name,
    name_ru: null,
    data: {
      name: item.name,
      item_type: item.category.name,
      rarity: rarities.get(item.rarity.key),
      cost: '',
      weight: String(Number(item.weight)),
      weight_unit: 'lb',
      description: item.desc,
      attunement: item.requires_attunement,
      attunement_detail: item.attunement_detail ?? '',
      source_document: DOCUMENT,
      source_collection: 'magicitems',
      source_url: `https://api.open5e.com/v2/magicitems/${item.key}/`,
      license: 'CC-BY-4.0',
    },
  }
}

export function validateCatalog(source) {
  requireValue(object(source) && source.document === DOCUMENT, 'Invalid source envelope')
  requireValue(
    Number.isSafeInteger(source.count) && source.count > 0 && source.count <= 5000,
    'Invalid source count'
  )
  requireValue(
    Array.isArray(source.results) && source.results.length === source.count,
    'Incomplete source'
  )
  const rows = source.results
    .map(normalizeMagicItem)
    .sort((a, b) => a.key.localeCompare(b.key, 'en'))
  requireValue(new Set(rows.map((row) => row.key)).size === rows.length, 'Duplicate source key')
  return rows
}

export async function downloadCatalog(fetcher = fetch) {
  const results = []
  const visited = new Set()
  let next = SOURCE_URL
  let expected
  while (next !== null) {
    requireValue(
      typeof next === 'string' && visited.size < 100 && !visited.has(next),
      'Invalid pagination/cycle'
    )
    const url = new URL(next)
    requireValue(
      url.origin === 'https://api.open5e.com' &&
        url.pathname === '/v2/magicitems/' &&
        url.searchParams.get('document') === DOCUMENT &&
        !url.username &&
        !url.password,
      'Unexpected pagination source'
    )
    requireValue(
      [...url.searchParams.keys()].every((key) => ['document', 'limit', 'page'].includes(key)),
      'Unexpected pagination filter'
    )
    visited.add(next)
    const response = await fetcher(url, { signal: AbortSignal.timeout(20000), redirect: 'error' })
    requireValue(response.ok, `Source HTTP ${response.status}`)
    const page = await response.json()
    requireValue(object(page) && Array.isArray(page.results), 'Invalid page')
    if (expected === undefined) expected = page.count
    requireValue(
      page.count === expected && Number.isSafeInteger(expected) && expected > 0 && expected <= 5000,
      'Source count changed/invalid'
    )
    results.push(...page.results)
    requireValue(results.length <= expected, 'Source exceeds count')
    next = page.next
  }
  const source = { document: DOCUMENT, count: expected, url: SOURCE_URL, results }
  validateCatalog(source)
  return source
}

export function prepareImport(source, baseline, projectRef) {
  requireValue(
    typeof projectRef === 'string' && /^[a-z]{20}$/.test(projectRef),
    'Explicit project ref required'
  )
  requireValue(object(baseline) && baseline.projectRef === projectRef, 'Baseline project mismatch')
  requireValue(/^[a-f0-9]{32}$/.test(baseline.fingerprint), 'Missing database fingerprint')
  requireValue(
    Array.isArray(baseline.rows) && baseline.count === baseline.rows.length && baseline.count > 0,
    'Incomplete backup'
  )
  const keys = baseline.rows.map((row) => row.key)
  requireValue(
    keys.every((key) => typeof key === 'string') && new Set(keys).size === keys.length,
    'Invalid backup keys'
  )
  const rows = validateCatalog(source)
  const existing = new Set(keys)
  const additions = rows.filter((row) => !existing.has(row.key))
  const sha256 = createHash('sha256').update(JSON.stringify(rows)).digest('hex')
  const plan = {
    projectRef,
    document: DOCUMENT,
    sourceCount: rows.length,
    sourceSha256: sha256,
    baselineCount: baseline.count,
    baselineFingerprint: baseline.fingerprint,
    skippedKeys: rows.filter((row) => existing.has(row.key)).map((row) => row.key),
    insertedKeys: additions.map((row) => row.key),
    expectedInsertCount: additions.length,
  }
  // Standard SQL strings with explicit standard_conforming_strings avoid dollar-quote collisions.
  const quote = (value) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`
  const baselineKeySql = quote(keys)
  const additionsSql = quote(additions)
  let blockTag = '$catalog_import$'
  while (additionsSql.includes(blockTag) || baselineKeySql.includes(blockTag))
    blockTag = blockTag.replace('$', '$_')
  const fingerprint = (where) =>
    `(select md5(string_agg(md5(to_jsonb(t)::text), '|' order by key)) from public.srd_items t ${where})`
  const preservedWhere = `where key in (select jsonb_array_elements_text(${baselineKeySql}))`
  const sql = `-- Project: ${projectRef}; source SHA256: ${sha256}
BEGIN;
SET LOCAL standard_conforming_strings = on;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
LOCK TABLE public.srd_items IN SHARE ROW EXCLUSIVE MODE;
DO ${blockTag}
DECLARE inserted integer;
BEGIN
  IF ${fingerprint('')} IS DISTINCT FROM '${baseline.fingerprint}' THEN
    RAISE EXCEPTION 'Catalog changed since backup; prepare a fresh plan';
  END IF;
  INSERT INTO public.srd_items (key, name, name_ru, data)
  SELECT key, name, name_ru, data FROM jsonb_to_recordset(${additionsSql})
    AS r(key text, name text, name_ru text, data jsonb)
  ON CONFLICT (key) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted <> ${additions.length} THEN RAISE EXCEPTION 'Unexpected insert count'; END IF;
  IF ${fingerprint(preservedWhere)} IS DISTINCT FROM '${baseline.fingerprint}' THEN
    RAISE EXCEPTION 'Existing catalog was changed';
  END IF;
END;
${blockTag};
SELECT count(*) AS catalog_count FROM public.srd_items;
COMMIT;
`
  return { plan, rows, sql }
}
