import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { createEmptyCharacterData, type CharacterData } from '../src/lib/types'
import { srdInventoryMetadata } from '../src/lib/dnd/srd-inventory-metadata'
import { itemRarityLabel, itemTypeLabel } from '../src/lib/dnd/inventory-metadata'

// The actual action runs with recording database/auth/cache boundaries. No network or live writes.
const source = ts.transpileModule(
  readFileSync(new URL('../src/lib/actions/add-item-to-character.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText

function rig(
  options: {
    data?: unknown
    itemData?: unknown
    user?: string | null
    isDm?: boolean
    itemMissing?: boolean
    itemError?: boolean
    characterMissing?: boolean
    changed?: boolean
    rpcError?: boolean
  } = {}
) {
  const data = 'data' in options ? options.data : characterData()
  const itemData =
    'itemData' in options
      ? options.itemData
      : {
          item_type: 'Weapon',
          rarity: 'Very Rare',
          weight: '3',
          description: 'Catalog description',
        }
  const writes: { name: string; args: any }[] = []
  const reads: { table: string; filters: [string, unknown][] }[] = []
  const refreshed: string[] = []
  const access: string[] = []
  const db = {
    auth: {
      getUser: async () => ({
        data: { user: options.user === null ? null : { id: options.user ?? 'owner' } },
      }),
    },
    from(table: string) {
      assert.ok(['srd_items', 'characters'].includes(table), `unexpected table: ${table}`)
      const read = { table, filters: [] as [string, unknown][] }
      reads.push(read)
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          read.filters.push([key, value])
          return query
        },
        maybeSingle: async () => ({
          data: options.itemMissing
            ? null
            : { name: 'Catalog sword', name_ru: 'Меч из справочника', data: itemData },
          error: options.itemError ? { message: 'synthetic catalog failure' } : null,
        }),
        single: async () => ({
          data: options.characterMissing ? null : { user_id: 'owner', data_json: data },
        }),
      }
      return query
    },
    rpc: async (name: string, args: unknown) => {
      writes.push({ name, args })
      return {
        data: options.changed ?? true,
        error: options.rpcError ? { message: 'synthetic write failure' } : null,
      }
    },
  }
  const imports: Record<string, unknown> = {
    'node:crypto': { randomUUID },
    '@/lib/supabase/server': { createClient: async () => db },
    'next/cache': { revalidatePath: (value: string) => refreshed.push(value) },
    '@/lib/queries/access': {
      getCampaignAccess: async (id: string) => {
        access.push(id)
        return { isDm: options.isDm ?? false }
      },
    },
    '@/lib/dnd/srd-inventory-metadata': { srdInventoryMetadata },
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', 'console', source)(
    (name: string) => {
      assert.ok(name in imports, `unexpected real dependency: ${name}`)
      return imports[name]
    },
    exports,
    { error() {} }
  )
  const action = (exports as typeof import('../src/lib/actions/add-item-to-character'))
    .addSrdItemToCharacter
  return { action, data, itemData, writes, reads, refreshed, access }
}

function characterData() {
  return {
    ...createEmptyCharacterData(),
    class: 'sorcerer',
    subclass: 'draconic-sorcery',
    hp: { current: 4, max: 8, temp: 2 },
    inventory: [{ id: 'legacy', name: 'Старая вещь', quantity: 2, custom: { keep: true } }],
    spells: [{ id: 'shield', name: 'Щит', level: 1, prepared: true }],
    spellSlots: { 1: { current: 0, max: 2 } },
    currency: { gp: 7 },
    notes: 'keep notes',
    extension: { nested: ['unchanged'] },
  }
}

test('all 20 observed catalog categories map conservatively to inventory display categories', () => {
  const observed = {
    'Adventuring Gear': 'other',
    Ammunition: 'consumable',
    Armor: 'armor',
    'Equipment Pack': 'other',
    'Land Vehicle': 'other',
    Mount: 'other',
    Poison: 'consumable',
    Potion: 'consumable',
    Ring: 'other',
    Rod: 'other',
    Scroll: 'consumable',
    Shield: 'armor',
    'Spellcasting Focus': 'other',
    Staff: 'other',
    Tools: 'tool',
    'Trade Good': 'other',
    Wand: 'other',
    'Waterborne Vehicle': 'other',
    Weapon: 'weapon',
    'Wondrous Item': 'wondrous',
  }
  for (const [item_type, expected] of Object.entries(observed)) {
    assert.deepEqual(srdInventoryMetadata({ item_type, rarity: 'common' }), {
      itemType: expected,
      rarity: 'common',
    })
  }
})

test('rarity spelling/case/spacing and canonical types retain recognized metadata without coercion', () => {
  for (const [raw, expected] of [
    [' common ', 'common'],
    ['UNCOMMON', 'uncommon'],
    ['Rare', 'rare'],
    ['Very Rare', 'very_rare'],
    ['very_rare', 'very_rare'],
    [' VERY-RARE ', 'very_rare'],
    ['Legendary', 'legendary'],
    ['Artifact', 'artifact'],
  ]) {
    assert.deepEqual(srdInventoryMetadata({ item_type: ' Wondrous_Item ', rarity: raw }), {
      itemType: 'wondrous',
      rarity: expected,
    })
  }
  for (const itemType of ['weapon', 'armor', 'consumable', 'tool', 'wondrous', 'other']) {
    assert.equal(srdInventoryMetadata({ item_type: itemType }).itemType, itemType)
  }
  for (const value of [
    null,
    undefined,
    {},
    [],
    123,
    true,
    'rare',
    { item_type: '__proto__', rarity: 'constructor' },
    { item_type: {}, rarity: { name: 'rare' } },
    { item_type: 'magic weapon +3', rarity: 'varies' },
  ]) {
    assert.deepEqual(srdInventoryMetadata(value), { itemType: 'other' })
  }
})

test('actual import action appends metadata once via original JSON CAS and preserves every existing field', async () => {
  const r = rig()
  const before = structuredClone(r.data)
  const catalogBefore = structuredClone(r.itemData)
  assert.deepEqual(await r.action('srd-sword', 'character', 'campaign'), { success: true })
  assert.equal(r.writes.length, 1)
  assert.equal(r.writes[0].name, 'update_character_data_cas')
  const args = r.writes[0].args
  assert.equal(args.p_character_id, 'character')
  assert.equal(args.p_campaign_id, 'campaign')
  assert.strictEqual(args.p_expected, r.data)
  const next = args.p_next as CharacterData
  const imported = next.inventory!.at(-1)!
  assert.match(imported.id, /^item-[0-9a-f-]{36}$/)
  assert.deepEqual(imported, {
    id: imported.id,
    name: 'Меч из справочника',
    quantity: 1,
    weight: 3,
    notes: 'Catalog description',
    itemType: 'weapon',
    rarity: 'very_rare',
  })
  assert.deepEqual(next, {
    ...(before as object),
    inventory: [...(before as ReturnType<typeof characterData>).inventory, imported],
  })
  assert.deepEqual(r.data, before)
  assert.deepEqual(r.itemData, catalogBefore)
  assert.deepEqual(r.refreshed, ['/campaign/campaign/characters/character'])
  assert.deepEqual(r.access, ['campaign'])
  assert.deepEqual(r.reads, [
    { table: 'srd_items', filters: [['key', 'srd-sword']] },
    {
      table: 'characters',
      filters: [
        ['id', 'character'],
        ['campaign_id', 'campaign'],
      ],
    },
  ])
  assert.equal(itemTypeLabel(imported.itemType, 'ru'), 'Оружие')
  assert.equal(itemRarityLabel(imported.rarity, 'ru'), 'Очень редкий')
  assert.equal(itemRarityLabel(imported.rarity, 'en'), 'Very rare')
})

test('unknown catalog categories and rarity are not guessed; repeated imports use distinct item IDs', async () => {
  const r = rig({ itemData: { item_type: 'Mystery', rarity: 'varies', description: 'Unknown' } })
  for (let n = 0; n < 2; n++)
    assert.deepEqual(await r.action('srd-item', 'character', 'campaign'), { success: true })
  const items = r.writes.map((write) => write.args.p_next.inventory.at(-1))
  assert.notEqual(items[0].id, items[1].id)
  for (const item of items) {
    assert.equal(item.itemType, 'other')
    assert.equal(Object.hasOwn(item, 'rarity'), false)
    assert.equal(Object.hasOwn(item, 'equipped'), false)
    assert.equal(Object.hasOwn(item, 'attuned'), false)
  }
})

test('unauthenticated, unrelated player and missing catalog/character paths never write or revalidate', async () => {
  for (const options of [
    { user: null },
    { user: 'stranger' },
    { itemMissing: true },
    { itemError: true },
    { characterMissing: true },
  ]) {
    const r = rig(options)
    assert.ok('error' in (await r.action('srd-item', 'character', 'campaign')))
    assert.deepEqual(r.writes, [])
    assert.deepEqual(r.refreshed, [])
  }
  const dm = rig({ user: 'dm', isDm: true })
  assert.deepEqual(await dm.action('srd-item', 'character', 'campaign'), { success: true })
  assert.equal(dm.writes.length, 1)
})

test('malformed request/source/character/inventory and item cap refuse destructive fallback writes', async () => {
  const invalid = rig()
  for (const args of [
    ['../bad', 'character', 'campaign'],
    ['srd-item', '', 'campaign'],
    ['srd-item', 'character', ''],
  ]) {
    assert.ok('error' in (await invalid.action(...(args as [string, string, string]))))
  }
  assert.deepEqual(invalid.reads, [])
  for (const options of [
    { itemData: null },
    { itemData: [] },
    { itemData: 'item' },
    { data: null },
    { data: [] },
    { data: 'character' },
    { data: { ...characterData(), inventory: {} } },
    {
      data: {
        ...characterData(),
        inventory: Array.from({ length: 500 }, (_, id) => ({
          id: String(id),
          name: 'existing',
          quantity: 1,
        })),
      },
    },
  ]) {
    const r = rig(options)
    const before = structuredClone(r.data)
    assert.ok('error' in (await r.action('srd-item', 'character', 'campaign')))
    assert.deepEqual(r.data, before)
    assert.deepEqual(r.writes, [])
    assert.deepEqual(r.refreshed, [])
  }
  const legacy = rig({ data: { ...createEmptyCharacterData(), inventory: null } })
  assert.deepEqual(await legacy.action('srd-item', 'character', 'campaign'), { success: true })
  assert.equal(legacy.writes[0].args.p_next.inventory.length, 1)
})

test('stale CAS and RPC failure are errors with no success refresh or automatic retry', async () => {
  for (const options of [{ changed: false }, { rpcError: true }]) {
    const r = rig(options)
    const before = structuredClone(r.data)
    assert.ok('error' in (await r.action('srd-item', 'character', 'campaign')))
    assert.equal(r.writes.length, 1)
    assert.deepEqual(r.data, before)
    assert.deepEqual(r.refreshed, [])
  }
})
