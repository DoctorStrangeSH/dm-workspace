import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import * as types from '../src/lib/types'
import * as level from '../src/lib/dnd/level-up'
import * as hp from '../src/lib/dnd/character-hp'
import * as identity from '../src/lib/dnd/character-identity-patch'
import * as classes from '../src/lib/dnd/srd-class-utils'
import * as constants from '../src/lib/dnd/constants'
import { srdClassToClassInfo, srdSpeciesToRaceInfo } from '../src/lib/dnd/srd-adapter'
import { buildCharacterData } from '../src/lib/dnd/character-builder'

// Execute the actual action module with a recording database boundary, not a parallel copy of it.
const source = ts.transpileModule(
  readFileSync(new URL('../src/lib/actions/characters.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText
function rig(
  data: unknown = { ...types.createEmptyCharacterData(), class: 'fighter' },
  authorized = true,
  changed = true
) {
  const writes: { kind: string; args: unknown }[] = []
  const events: string[] = []
  const reads = {
    select: () => reads,
    eq: () => reads,
    single: async () => ({ data: { user_id: 'owner', data_json: data, name: 'Test' } }),
  }
  const db = {
    auth: { getUser: async () => ({ data: { user: authorized ? { id: 'owner' } : null } }) },
    from: () => ({
      ...reads,
      insert: (args: unknown) => {
        writes.push({ kind: 'insert', args })
        return { select: () => ({ single: async () => ({ data: { id: 'new' }, error: null }) }) }
      },
    }),
    rpc: async (name: string, args: unknown) => {
      writes.push({ kind: name, args })
      return { data: changed, error: null }
    },
  }
  const imports: Record<string, unknown> = {
    '@/lib/supabase/server': { createClient: async () => db },
    'next/cache': { revalidatePath: () => events.push('revalidate') },
    '@/lib/queries/access': { getCampaignAccess: async () => ({ isMember: true, isDm: false }) },
    '@/lib/types': types,
    '@/lib/dnd/level-up': level,
    '@/lib/dnd/character-hp': hp,
    '@/lib/dnd/character-identity-patch': identity,
    '@/lib/dnd/srd-class-utils': classes,
    '@/lib/dnd/constants': constants,
    './logs': { logEvent: async () => events.push('log') },
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, `unexpected real dependency: ${name}`)
    return imports[name]
  }, exports)
  return { actions: exports as typeof import('../src/lib/actions/characters'), writes, events }
}

test('create/full JSON/manual HP actions reject corrupt HP before INSERT or RPC', async () => {
  for (const invalid of [
    null,
    {},
    { current: '10', max: 10 },
    { current: 11, max: 10 },
    { current: 0, max: -1 },
    { current: 1, max: 10, temp: NaN },
  ]) {
    const r = rig()
    const data = {
      ...types.createEmptyCharacterData(),
      class: 'fighter',
      hp: invalid,
    } as types.CharacterData
    assert.ok('error' in (await r.actions.createCharacter('campaign', 'Name', data)))
    assert.ok(
      'error' in
        (await r.actions.updateCharacter('character', 'campaign', {
          data_json: data,
          expected_data_json: types.createEmptyCharacterData(),
        }))
    )
    assert.equal(r.writes.length, 0)
    assert.equal(r.events.length, 0)
  }
  for (const patch of [
    null,
    [],
    { current: NaN },
    { current: 1.5 },
    { current: -1 },
    { temp: '5' },
  ]) {
    const r = rig()
    assert.ok(
      'error' in
        (await r.actions.updateCharacterHP('character', 'campaign', patch as { current: number }))
    )
    assert.equal(r.writes.length, 0)
  }
})

test('valid creation/full JSON writes stay available, while unrelated saves cannot carry corrupt HP', async () => {
  const data = { ...types.createEmptyCharacterData(), class: 'fighter' }
  const r = rig(data)
  assert.deepEqual(await r.actions.createCharacter('campaign', 'Name', data), {
    success: true,
    characterId: 'new',
  })
  const next = { ...data, notes: 'edited' }
  assert.deepEqual(
    await r.actions.updateCharacter('character', 'campaign', {
      data_json: next,
      expected_data_json: data,
    }),
    { success: true }
  )
  assert.equal(r.writes[0].kind, 'insert')
  assert.deepEqual(r.writes[1], {
    kind: 'update_character_data_cas',
    args: {
      p_character_id: 'character',
      p_campaign_id: 'campaign',
      p_expected: data,
      p_next: next,
    },
  })
  const broken = rig({ ...data, hp: { current: 1 } })
  assert.ok(
    'error' in (await broken.actions.addSpell('character', 'campaign', { name: 'Test', level: 1 }))
  )
  assert.deepEqual(broken.writes, [])
})

test('valid manual HP retains original JSON as CAS expected; save failures do not report success', async () => {
  const data = { ...types.createEmptyCharacterData(), class: 'fighter', notes: 'keep' }
  const before = structuredClone(data)
  const r = rig(data)
  assert.deepEqual(await r.actions.updateCharacterHP('character', 'campaign', { current: 5 }), {
    success: true,
  })
  assert.deepEqual(r.writes, [
    {
      kind: 'update_character_data_cas',
      args: {
        p_character_id: 'character',
        p_campaign_id: 'campaign',
        p_expected: before,
        p_next: { ...before, hp: { ...before.hp, current: 5 } },
      },
    },
  ])
  assert.deepEqual(data, before)
  const stale = rig(data, true, false)
  assert.ok(
    'error' in (await stale.actions.updateCharacterHP('character', 'campaign', { current: 5 }))
  )
  assert.equal(stale.events.length, 0)
})

test('level-up malformed requests and saved state produce no RPC, log or revalidation', async () => {
  for (const options of [
    null,
    {},
    { hpMethod: 'other' },
    { hpMethod: 'average', abilityChanges: { str: 100 } },
  ]) {
    const r = rig()
    assert.ok(
      'error' in
        (await r.actions.levelUp(
          'character',
          'campaign',
          options as Parameters<typeof r.actions.levelUp>[2]
        ))
    )
    assert.equal(r.writes.length, 0)
    assert.equal(r.events.length, 0)
  }
  const r = rig({
    ...types.createEmptyCharacterData(),
    class: 'fighter',
    hp: { current: '10', max: '10' },
  })
  assert.ok('error' in (await r.actions.levelUp('character', 'campaign', { hpMethod: 'average' })))
  assert.equal(r.writes.length, 0)
})

test('valid level-up uses CAS once, preserves unrelated data, and logs only after successful save', async () => {
  const data = { ...types.createEmptyCharacterData(), class: 'fighter', notes: 'keep' }
  const r = rig(data)
  assert.deepEqual(await r.actions.levelUp('character', 'campaign', { hpMethod: 'average' }), {
    success: true,
    newLevel: 2,
    hpGain: 6,
  })
  assert.equal(r.writes.length, 1)
  const args = r.writes[0].args as { p_expected: unknown; p_next: types.CharacterData }
  assert.deepEqual(args.p_expected, data)
  assert.equal(args.p_next.hp.max, 16)
  assert.equal(args.p_next.notes, 'keep')
  assert.deepEqual(r.events, ['log', 'revalidate'])
  const stale = rig(data, true, false)
  assert.ok(
    'error' in (await stale.actions.levelUp('character', 'campaign', { hpMethod: 'average' }))
  )
  assert.deepEqual(stale.events, [])
  const denied = rig(data, false)
  assert.ok(
    'error' in (await denied.actions.levelUp('character', 'campaign', { hpMethod: 'average' }))
  )
  assert.equal(denied.writes.length, 0)
})

test('SRD sorcerer creation reaches INSERT with numeric 8 HP; former D62 payload is rejected', async () => {
  const data = buildCharacterData({
    name: 'Holmes',
    level: 1,
    race: srdSpeciesToRaceInfo({ key: 'srd-2024_human', name: 'Human', name_ru: null, data: {} }),
    class: srdClassToClassInfo({
      key: 'srd-2024_sorcerer',
      name: 'Sorcerer',
      name_ru: null,
      data: { hit_die: 'D6' },
    }),
    background: constants.BACKGROUNDS.find((bg) => bg.slug === 'entertainer')!,
    baseAbilities: { str: 15, dex: 14, con: 15, int: 8, wis: 10, cha: 8 },
    chosenSkills: ['arcana', 'nature'],
  })
  const r = rig()
  assert.deepEqual(await r.actions.createCharacter('campaign', 'Holmes', data), {
    success: true,
    characterId: 'new',
  })
  assert.equal(r.writes.length, 1)
  const inserted = r.writes[0].args as { data_json: types.CharacterData }
  assert.deepEqual(inserted.data_json.hp, { current: 8, max: 8, temp: 0 })
  const broken = rig()
  const corrupt = {
    ...data,
    hp: { current: 'D62', max: 'D62', temp: 0 },
  } as unknown as types.CharacterData
  assert.ok('error' in (await broken.actions.createCharacter('campaign', 'Holmes', corrupt)))
  assert.deepEqual(broken.writes, [])
})
