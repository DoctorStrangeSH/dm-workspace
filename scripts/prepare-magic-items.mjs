// Offline planning / SQL preparation only. This script cannot connect to a database.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { downloadCatalog, prepareImport, validateCatalog } from './lib/magic-item-catalog.mjs'

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    out: { type: 'string' },
    baseline: { type: 'string' },
    'project-ref': { type: 'string' },
    'prepare-sql': { type: 'boolean', default: false },
  },
})
if (!values.out) throw new Error('--out directory is required')
const source = values.source
  ? JSON.parse(await readFile(values.source, 'utf8'))
  : await downloadCatalog()
const rows = validateCatalog(source)
await mkdir(values.out, { recursive: true })
await writeFile(`${values.out}/source.json`, JSON.stringify(source))
if (values['prepare-sql']) {
  if (!values.baseline || !values['project-ref'])
    throw new Error('--baseline and --project-ref are required')
  const baseline = JSON.parse(await readFile(values.baseline, 'utf8'))
  const { plan, sql } = prepareImport(source, baseline, values['project-ref'])
  await writeFile(`${values.out}/plan.json`, JSON.stringify(plan, null, 2))
  await writeFile(`${values.out}/import.sql`, sql)
  console.log(
    JSON.stringify({
      mode: 'prepare-only',
      ...plan,
      insertedKeys: undefined,
      skippedKeys: undefined,
    })
  )
} else {
  console.log(JSON.stringify({ mode: 'dry-run', validatedCount: rows.length, databaseWrites: 0 }))
}
