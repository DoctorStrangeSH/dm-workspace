import { useSyncExternalStore } from 'react'
import type { AnchorHTMLAttributes } from 'react'
import type { CharacterData, MessageWithAuthor } from '../../src/lib/types'

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
  createdCharacters: [] as { campaignId: string; name: string; data: CharacterData }[],
  navigated: [] as string[],
  chapterSaves: [] as string[],
  chapterSaveFails: false,
  failNext: false,
  delay: 0,
  incoming() {
    messages = [...messages, makeMessage(crypto.randomUUID(), 'Новое сообщение группы')]
    emit()
  },
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
  return { error: 'Offline character action boundary' }
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
