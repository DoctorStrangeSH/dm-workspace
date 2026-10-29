import { useSyncExternalStore } from 'react'
import type { AnchorHTMLAttributes } from 'react'
import type { MessageWithAuthor } from '../../src/lib/types'

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
  failNext: false,
  delay: 0,
  incoming() {
    messages = [...messages, makeMessage(crypto.randomUUID(), 'Новое сообщение группы')]
    emit()
  },
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
  return { refresh() {}, push() {} }
}
export async function setTheme() {
  return { success: true }
}
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />
}
