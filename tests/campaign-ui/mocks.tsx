import { useSyncExternalStore } from 'react'
import { tokenTransport } from './token-transport'
import type { AnchorHTMLAttributes } from 'react'
import type {
  CharacterData,
  MessageWithAuthor,
  MessageType,
  MessageMetadata,
} from '../../src/lib/types'
import type { ItemFilters, SrdItemsPageResult } from '../../src/lib/actions/items-search'
import type { SpellFilters } from '../../src/lib/actions/spells-search'
import type { MonsterFilters } from '../../src/lib/actions/bestiary-search'
type ReferenceFilters = SpellFilters & MonsterFilters

// In-memory transport only. No Supabase, sessions, credentials or remote fetches.
const listeners = new Set<() => void>()
const author = { id: 'other', username: 'Mira', display_name: 'Мира', avatar_url: null }
const makeMessage = (id: string, content: string, userId = 'other'): MessageWithAuthor => ({
  id,
  campaign_id: 'test',
  user_id: userId,
  content,
  type: 'text',
  metadata: {},
  created_at: '2026-10-29T07:00:00Z',
  author: { ...author, id: userId },
})
let messages = Array.from({ length: 50 }, (_, n) =>
  makeMessage(String(n), `История ${n + 1}: дорога к старой башне.`)
)
const emit = () => listeners.forEach((listener) => listener())
export const lab = {
  sent: [] as string[],
  sentRolls: [] as MessageMetadata[],
  throwNextMessage: false,
  joinCalls: [] as string[],
  joinOutcome: 'success' as 'success' | 'invalid_invite' | 'auth_required' | 'uncertain' | 'throw',
  joinPending: [] as (() => void)[],
  joinDeferred: false,
  mapActions: [] as { name: string; args: unknown[] }[],
  mapOutcome: 'success' as 'success' | 'error' | 'throw',
  mapDelay: 0,
  mapDeferred: false,
  mapPending: [] as { resolve: () => void }[],
  moveDeferred: false,
  movePending: [] as {
    resolve: (result: { error?: string }) => void
    reject: (error: Error) => void
  }[],
  campaignActions: [] as { name: string; args: unknown[] }[],
  copiedLinks: [] as string[],
  campaignOutcome: 'error' as 'error' | 'success' | 'throw',
  campaignDelay: 0,
  sessionActions: [] as { name: string; args: unknown[] }[],
  sessionOutcome: 'error' as 'error' | 'success' | 'throw',
  sessionDelay: 0,
  characterActions: [] as { name: string; args: unknown[] }[],
  refreshes: 0,
  entityCreates: [] as { campaignId: string; type: string }[],
  identityOutcome: 'error' as 'error' | 'success' | 'throw',
  identityDelay: 0,
  sheetOutcome: 'error' as 'error' | 'success' | 'throw',
  sheetDelay: 0,
  createdCharacters: [] as { campaignId: string; name: string; data: CharacterData }[],
  createOutcome: 'success' as 'success' | 'error' | 'throw',
  createDelay: 0,
  chapterCreates: [] as { campaignId: string; title: string }[],
  navigated: [] as string[],
  chapterSaves: [] as string[],
  chapterSaveFails: false,
  failNext: false,
  delay: 0,
  catalogMode: 'normal' as 'normal' | 'deferred' | 'error' | 'throw',
  referenceRequests: [] as {
    kind: 'spells' | 'bestiary'
    filters: ReferenceFilters
    offset: number
  }[],
  referencePending: [] as {
    kind: 'spells' | 'bestiary'
    filters: ReferenceFilters
    offset: number
    resolve: (value: SrdItemsPageResult) => void
    reject: (error: Error) => void
  }[],
  catalogRequests: [] as { filters: ItemFilters; offset: number }[],
  catalogPending: [] as {
    resolve: (result: SrdItemsPageResult) => void
    reject: (error: Error) => void
    filters: ItemFilters
    offset: number
  }[],
  incoming() {
    messages = [...messages, makeMessage(crypto.randomUUID(), 'Новое сообщение группы')]
    emit()
  },
}
export function catalogPage(filters: ItemFilters = {}, offset = 0): SrdItemsPageResult {
  if (new URLSearchParams(location.search).has('catalogAppearance')) {
    const rows = [
      {
        key: 'offline-long-wand',
        name: 'Ancient Wand of the Unbreakable Everlasting Celestial Constellation',
        name_ru: null,
        data: {
          item_type: 'Wand',
          rarity: 'rare',
          attunement: true,
          cost: '250 gp',
          description: 'Synthetic display fixture',
        },
      },
      {
        key: 'offline-unknown-category',
        name: 'Unbroken'.repeat(12),
        name_ru: null,
        data: {
          item_type: 'Uncatalogued Relic',
          rarity: 'common',
          attunement: false,
          description: 'Synthetic unknown-category fixture',
        },
      },
    ].filter((row) => !filters.type?.length || filters.type.includes(row.data.item_type))
    return { ok: true, items: rows.slice(offset, offset + 24), hasNext: false }
  }
  const count = filters.query === 'none' ? 0 : filters.query ? 3 : filters.rarity?.length ? 10 : 55
  const items = Array.from({ length: count }, (_, i) => ({
    key: `srd-2024_offline-${i}`,
    name: `${filters.query || 'Item'} ${String(i + 1).padStart(3, '0')}`,
    name_ru: null,
    data: {
      item_type: 'Wand',
      rarity: filters.rarity?.[0] ?? 'rare',
      description: 'Synthetic catalog description',
      weight: '1',
      attunement: true,
    },
  }))
  return { ok: true, items: items.slice(offset, offset + 24), hasNext: count > offset + 24 }
}
export async function searchSrdItemsPageAction(
  filters: ItemFilters = {},
  offset = 0
): Promise<SrdItemsPageResult> {
  lab.catalogRequests.push({ filters: structuredClone(filters), offset })
  if (lab.catalogMode === 'error') return { ok: false }
  if (lab.catalogMode === 'throw') throw new Error('Offline catalog transport failure')
  if (lab.catalogMode === 'deferred')
    return new Promise((resolve, reject) =>
      lab.catalogPending.push({ resolve, reject, filters, offset })
    )
  return catalogPage(filters, offset)
}
Object.assign(window, { __catalogPage: catalogPage })
export function referencePage(
  kind: 'spells' | 'bestiary',
  filters: ReferenceFilters = {},
  offset = 0
): SrdItemsPageResult {
  if (kind === 'bestiary' && new URLSearchParams(location.search).has('monsterAppearance')) {
    const items = [
      {
        key: 'offline-long-monster',
        name: 'Ancient Guardian of the Everlasting Celestial Constellation',
        name_ru: null,
        data: {
          type: 'Dragon',
          size: 'Large',
          alignment: 'Synthetic alignment',
          cr: '1/8',
          ac: 17,
          hp: 123,
          speed: 0,
          xp: 25,
          abilities: { str: 23, dex: 8, con: 16, int: 10, wis: 19, cha: 12 },
          description: 'Synthetic creature description. ' + 'Unbroken'.repeat(30),
        },
      },
      {
        key: 'offline-custom-monster',
        name: 'Unbroken'.repeat(12),
        name_ru: null,
        data: { type: 'Custom Guardian', size: 'Uncatalogued Size', hp_max: 42 },
      },
      {
        key: 'offline-missing-monster',
        name: 'Missing creature stats',
        name_ru: null,
        data: { type: '', size: '' },
      },
    ]
    return { ok: true, items: items.slice(offset, offset + 24), hasNext: false }
  }
  if (kind === 'spells' && new URLSearchParams(location.search).has('spellAppearance')) {
    const items = [
      {
        key: 'offline-long-spell',
        name: 'Ancient Constellation of the Everlasting Celestial Guardian',
        name_ru: null,
        data: {
          level: 3,
          school: 'Evocation',
          castingTime: '1 action',
          range: '60 feet',
          components: 'V, S, M (a silver star)',
          duration: 'Up to 1 minute',
          ritual: true,
          concentration: true,
          description: 'Synthetic spell description',
          higherLevel: 'Synthetic higher-level description',
          classes: ['Wizard', 'srd-2024_cleric', 'Mystic Sage'],
        },
      },
      {
        key: 'offline-missing-spell',
        name: 'Unbroken'.repeat(12),
        name_ru: null,
        data: { level: 0, school: '', classes: [], ritual: false, concentration: false },
      },
      {
        key: 'offline-unknown-school',
        name: 'Unknown-school spell',
        name_ru: null,
        data: {
          level: 1,
          school: 'Custom Arcanum',
          castingTime: 'A custom casting condition that remains unchanged',
          classes: ['Mystic Sage'],
        },
      },
    ]
    return { ok: true, items: items.slice(offset, offset + 24), hasNext: false }
  }
  const filtered =
    filters.level?.length || filters.school?.length || filters.cr?.length || filters.type?.length
  const count = filters.query === 'none' ? 0 : filters.query ? 3 : filtered ? 10 : 55
  const items = Array.from({ length: count }, (_, i) => ({
    key: `offline-${kind}-${i}`,
    name: `${filters.query || (kind === 'spells' ? 'Spell' : 'Monster')} ${String(i + 1).padStart(3, '0')}`,
    name_ru: null,
    data:
      kind === 'spells'
        ? {
            level: filters.level?.[0] ?? 0,
            school: 'Evocation',
            description: 'Offline spell description',
            classes: [],
            components: 'V',
            castingTime: '1 action',
            range: '60 feet',
            duration: 'Instantaneous',
          }
        : {
            cr: filters.cr?.[0] ?? '1/8',
            type: filters.type?.[0] ?? 'dragon',
            size: 'large',
            hp: 10,
            ac: 12,
            abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          },
  }))
  return { ok: true, items: items.slice(offset, offset + 24), hasNext: count > offset + 24 }
}
Object.assign(window, { __referencePage: referencePage })
async function loadReference(
  kind: 'spells' | 'bestiary',
  filters: ReferenceFilters,
  offset: number
): Promise<SrdItemsPageResult> {
  lab.referenceRequests.push({ kind, filters: structuredClone(filters), offset })
  if (lab.catalogMode === 'error') return { ok: false }
  if (lab.catalogMode === 'throw') throw new Error('Offline reference failure')
  if (lab.catalogMode === 'deferred')
    return new Promise((resolve, reject) =>
      lab.referencePending.push({ kind, filters, offset, resolve, reject })
    )
  return referencePage(kind, filters, offset)
}
export async function searchSrdSpellsPageAction(filters: SpellFilters = {}, offset = 0) {
  return loadReference('spells', filters, offset)
}
export async function searchSrdMonstersPageAction(filters: MonsterFilters = {}, offset = 0) {
  return loadReference('bestiary', filters, offset)
}
export async function addSrdSpellToCharacter(...args: unknown[]) {
  lab.characterActions.push({ name: 'addSrdSpellToCharacter', args })
  return { error: 'Offline write boundary' }
}
export async function addMonsterToCampaign(...args: unknown[]) {
  lab.characterActions.push({ name: 'addMonsterToCampaign', args })
  return { error: 'Offline write boundary' }
}
export async function addSrdItemToCharacter(...args: unknown[]) {
  lab.characterActions.push({ name: 'addSrdItemToCharacter', args })
  return { error: 'Offline catalog write boundary' }
}
export async function addSrdItemToCampaign(...args: unknown[]) {
  lab.characterActions.push({ name: 'addSrdItemToCampaign', args })
  return { error: 'Offline catalog write boundary' }
}
export async function createCharacter(campaignId: string, name: string, data: CharacterData) {
  lab.createdCharacters.push({ campaignId, name, data: structuredClone(data) })
  if (lab.createDelay > 0) await new Promise((resolve) => setTimeout(resolve, lab.createDelay))
  if (lab.createOutcome === 'throw') throw Error('Synthetic creation transport failure')
  if (lab.createOutcome === 'error') return { error: 'Offline creation failure' }
  return { success: true, characterId: 'offline-character' }
}
export async function createChapter(campaignId: string, data: FormData) {
  lab.chapterCreates.push({ campaignId, title: String(data.get('title')) })
  return { error: 'Offline chapter creation' }
}
export async function updateChapterContent(_chapter: string, _campaign: string, content: string) {
  lab.chapterSaves.push(content)
  if (lab.chapterSaveFails) return { error: 'Offline save failure' }
  return { success: true }
}
export async function getChapterForExport() {
  return { error: 'Offline export boundary', data: null }
}
Object.assign(window, { __uiLab: lab })
export async function sendMessage(
  _campaign: string,
  content: string,
  type: MessageType = 'text',
  metadata: MessageMetadata = {}
) {
  lab.sent.push(content)
  if (type === 'roll') lab.sentRolls.push(structuredClone(metadata))
  await new Promise((resolve) => setTimeout(resolve, lab.delay))
  if (lab.throwNextMessage) {
    lab.throwNextMessage = false
    throw Error('Synthetic message transport failure')
  }
  if (lab.failNext) {
    lab.failNext = false
    return { error: 'Synthetic send failure' }
  }
  messages = [...messages, { ...makeMessage(crypto.randomUUID(), content, 'self'), type, metadata }]
  emit()
  return { success: true, messageId: messages.at(-1)!.id }
}
export async function deleteMessage(id: string) {
  messages = messages.filter((message) => message.id !== id)
  emit()
  return { success: true }
}
export function useRealtimeMessages() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => messages
  )
}
export function usePathname() {
  return location.pathname.startsWith('/campaign/')
    ? location.pathname
    : location.pathname === '/session'
      ? '/campaign/test/session'
      : '/campaign/test'
}
export function useRouter() {
  return {
    refresh() {
      lab.refreshes++
    },
    replace(url: string) {
      lab.navigated.push(url)
    },
    push(url: string) {
      lab.navigated.push(url)
    },
  }
}
export async function setTheme() {
  return { success: true }
}
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />
}

// Record any real character control invoked by the offline sheet. Never call a backend.
export async function updateCharacter(...args: unknown[]) {
  lab.characterActions.push({ name: 'updateCharacter', args })
  await new Promise((resolve) => setTimeout(resolve, lab.sheetDelay))
  if (lab.sheetOutcome === 'throw') throw Error('Offline sheet transport failure')
  return lab.sheetOutcome === 'success'
    ? { success: true }
    : { error: 'Offline character action boundary' }
}
export async function updateCharacterIdentityAtomic(...args: unknown[]) {
  lab.characterActions.push({ name: 'updateCharacterIdentityAtomic', args })
  await new Promise((resolve) => setTimeout(resolve, lab.identityDelay))
  if (lab.identityOutcome === 'throw') throw Error('Offline identity transport failure')
  return lab.identityOutcome === 'success'
    ? { success: true }
    : { error: 'Offline character action boundary' }
}
export async function rollDeathSave(...args: unknown[]) {
  lab.characterActions.push({ name: 'rollDeathSave', args })
  return { error: 'Offline character action boundary' }
}
export async function resetDeathSaves(...args: unknown[]) {
  lab.characterActions.push({ name: 'resetDeathSaves', args })
  return { error: 'Offline character action boundary' }
}
export async function levelUp(...args: unknown[]) {
  lab.characterActions.push({ name: 'levelUp', args })
  return { error: 'Offline character action boundary' }
}
export async function spendSpellSlot(...args: unknown[]) {
  lab.characterActions.push({ name: 'spendSpellSlot', args })
  return { error: 'Offline character action boundary' }
}
export async function updateSpell(...args: unknown[]) {
  lab.characterActions.push({ name: 'updateSpell', args })
  return { error: 'Offline character action boundary' }
}
export async function removeSpell(...args: unknown[]) {
  lab.characterActions.push({ name: 'removeSpell', args })
  return { error: 'Offline character action boundary' }
}
export async function addInventoryItem(...args: unknown[]) {
  lab.characterActions.push({ name: 'addInventoryItem', args })
  return { error: 'Offline character action boundary' }
}
export async function addSpell(...args: unknown[]) {
  lab.characterActions.push({ name: 'addSpell', args })
  return { error: 'Offline character action boundary' }
}
export async function updateCurrency(...args: unknown[]) {
  lab.characterActions.push({ name: 'updateCurrency', args })
  return { error: 'Offline character action boundary' }
}
export async function updateInventoryItem(...args: unknown[]) {
  lab.characterActions.push({ name: 'updateInventoryItem', args })
  return { error: 'Offline character action boundary' }
}
export async function removeInventoryItem(...args: unknown[]) {
  lab.characterActions.push({ name: 'removeInventoryItem', args })
  return { error: 'Offline character action boundary' }
}
export async function toggleEquipped(...args: unknown[]) {
  lab.characterActions.push({ name: 'toggleEquipped', args })
  return { error: 'Offline character action boundary' }
}
export async function toggleAttuned(...args: unknown[]) {
  lab.characterActions.push({ name: 'toggleAttuned', args })
  return { error: 'Offline character action boundary' }
}
export async function longRest(...args: unknown[]) {
  lab.characterActions.push({ name: 'longRest', args })
  return { error: 'Offline character action boundary' }
}
export async function updateCharacterHP(...args: unknown[]) {
  lab.characterActions.push({ name: 'updateCharacterHP', args })
  return { error: 'Offline character action boundary' }
}

async function sessionAction(name: string, args: unknown[]) {
  lab.sessionActions.push({ name, args })
  if (lab.sessionDelay) await new Promise((resolve) => setTimeout(resolve, lab.sessionDelay))
  if (lab.sessionOutcome === 'throw') throw new Error('Offline network failure')
  return lab.sessionOutcome === 'success'
    ? { success: true }
    : { error: 'Offline session action boundary' }
}
export async function createSession(...args: unknown[]) {
  return sessionAction('createSession', args)
}
export async function deleteSession(...args: unknown[]) {
  return sessionAction('deleteSession', args)
}
export async function setRsvp(...args: unknown[]) {
  return sessionAction('setRsvp', args)
}

async function campaignAction(name: string, args: unknown[]) {
  lab.campaignActions.push({ name, args })
  if (lab.campaignDelay) await new Promise((resolve) => setTimeout(resolve, lab.campaignDelay))
  if (lab.campaignOutcome === 'throw') throw new Error('Offline campaign transport failure')
  if (lab.campaignOutcome === 'error') return { error: 'Offline campaign action boundary' }
  return { success: true, inviteCode: 'newcode8', campaignId: 'offline-created' }
}
export async function createCampaign(form: FormData) {
  return campaignAction('createCampaign', [Object.fromEntries(form)])
}
export async function deleteCampaign(...args: unknown[]) {
  return campaignAction('deleteCampaign', args)
}
export async function regenerateInviteCode(...args: unknown[]) {
  return campaignAction('regenerateInviteCode', args)
}

async function mapAction(name: string, args: unknown[]) {
  lab.mapActions.push({
    name,
    args: args.map((value) =>
      value instanceof File ? { name: value.name, type: value.type, size: value.size } : value
    ),
  })
  if (lab.mapDelay) await new Promise((resolve) => setTimeout(resolve, lab.mapDelay))
  if (lab.mapDeferred) await new Promise<void>((resolve) => lab.mapPending.push({ resolve }))
  if (lab.mapOutcome === 'throw') throw Error('Offline transport failure')
  if (lab.mapOutcome === 'error') return { error: 'Offline map action failed' }
  return { success: true, roll: 12, dexMod: 2, total: 14 }
}
export const uploadMap = (...args: unknown[]) => mapAction('uploadMap', args)
export const setActiveScene = (...args: unknown[]) => mapAction('setActiveScene', args)
export const deleteScene = (...args: unknown[]) => mapAction('deleteScene', args)
export const createScene = (...args: unknown[]) => mapAction('createScene', args)
export const startCombat = (...args: unknown[]) => mapAction('startCombat', args)
export const addCombatParticipants = async (...args: unknown[]) => ({
  ...(await mapAction('addCombatParticipants', args)),
  count: 3,
})
export const nextTurn = (...args: unknown[]) => mapAction('nextTurn', args)
export const endCombat = (...args: unknown[]) => mapAction('endCombat', args)
export const rollAllInitiatives = (...args: unknown[]) => mapAction('rollAllInitiatives', args)
export const rollInitiativeForToken = (...args: unknown[]) =>
  mapAction('rollInitiativeForToken', args)
export const damageToken = (...args: unknown[]) => mapAction('damageToken', args)
export const clearFog = (...args: unknown[]) => mapAction('clearFog', args)
export const revealArea = (...args: unknown[]) => mapAction('revealArea', args)
export const createWall = (...args: unknown[]) => mapAction('createWall', args)
export const deleteAllWalls = (...args: unknown[]) => mapAction('deleteAllWalls', args)
export const moveToken = async (id: string, sceneId: string, x: number, y: number) => {
  const result = await mapAction('moveToken', [id, sceneId, x, y])
  if ('error' in result) return result
  const deferred = lab.moveDeferred
    ? await new Promise<{ error?: string }>((resolve, reject) =>
        lab.movePending.push({ resolve, reject })
      )
    : {}
  if (deferred.error) return deferred
  return { success: true, position: tokenTransport.save(id, x, y) }
}
export const createToken = (...args: unknown[]) => mapAction('createToken', args)
export const updateTokenHP = (...args: unknown[]) => mapAction('updateTokenHP', args)
export const toggleTokenVisibility = (...args: unknown[]) =>
  mapAction('toggleTokenVisibility', args)
export const deleteToken = (...args: unknown[]) => mapAction('deleteToken', args)
export const updateTokenConditions = (...args: unknown[]) =>
  mapAction('updateTokenConditions', args)
export const addTokenOwner = (...args: unknown[]) => mapAction('addTokenOwner', args)
export const removeTokenOwner = (...args: unknown[]) => mapAction('removeTokenOwner', args)
export const approveSummonRequest = (...args: unknown[]) => mapAction('approveSummonRequest', args)
export const rejectSummonRequest = (...args: unknown[]) => mapAction('rejectSummonRequest', args)
export const createSummonRequest = (...args: unknown[]) => mapAction('createSummonRequest', args)
export function useRealtimeInitiative({
  initialInitiative,
}: {
  initialInitiative: import('../../src/lib/types').InitiativeEntryWithToken[]
}) {
  return initialInitiative
}
export function useRealtimeTokens({
  initialTokens,
}: {
  initialTokens: import('../../src/lib/types').Token[]
}) {
  return { tokens: initialTokens, isReady: true }
}
export function useRealtimeTokenOwners({
  initialOwners,
}: {
  initialOwners: import('../../src/lib/types').TokenOwnerWithProfile[]
}) {
  return { owners: initialOwners }
}
export function useRealtimeWalls({
  initialWalls,
}: {
  initialWalls: import('../../src/lib/types').SceneWall[]
}) {
  return { walls: initialWalls }
}
export function useRealtimeFog({
  initialFog,
}: {
  initialFog: import('../../src/lib/types').FogArea[]
}) {
  return initialFog
}
export function useRealtimeSummons({
  initialRequests,
}: {
  initialRequests: import('../../src/lib/types').SummonRequestWithRequester[]
}) {
  return { requests: initialRequests }
}

export function useSearchParams() {
  return new URLSearchParams(location.search)
}

export async function joinCampaign(code: string) {
  lab.joinCalls.push(code)
  if (lab.joinDeferred) await new Promise<void>((resolve) => lab.joinPending.push(resolve))
  if (lab.joinOutcome === 'throw') throw Error('Synthetic response lost')
  return lab.joinOutcome === 'success'
    ? { success: true, campaignId: 'synthetic-campaign' }
    : { error: 'Synthetic error', code: lab.joinOutcome }
}

export async function createEntity(campaignId: string, form: FormData) {
  lab.entityCreates.push({ campaignId, type: String(form.get('type')) })
  return { error: 'Synthetic save error' }
}
