import { useSyncExternalStore } from 'react'
import type { AnchorHTMLAttributes } from 'react'
import type { CharacterData, MessageWithAuthor } from '../../src/lib/types'
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
  characterActions: [] as { name: string; args: unknown[] }[],
  refreshes: 0,
  identityOutcome: 'error' as 'error' | 'success' | 'throw',
  identityDelay: 0,
  createdCharacters: [] as { campaignId: string; name: string; data: CharacterData }[],
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
  return { success: true, characterId: 'offline-character' }
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
export async function sendMessage(_campaign: string, content: string) {
  lab.sent.push(content)
  await new Promise((resolve) => setTimeout(resolve, lab.delay))
  if (lab.failNext) {
    lab.failNext = false
    return { error: 'Synthetic send failure' }
  }
  messages = [...messages, makeMessage(crypto.randomUUID(), content, 'self')]
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
  return { error: 'Offline character action boundary' }
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
