import type { Token } from '../../src/lib/types'
import { mapTokens, battleTokens } from './maps-data'

// Disposable transport boundary: the production Realtime hook runs unchanged.
const handlers = new Map<string, (payload: unknown) => void>()
let status: ((status: string) => void) | undefined
let revision = 0
export const tokenTransport = {
  rows: structuredClone(
    new URLSearchParams(location.search).has('manyTokens') ? battleTokens : mapTokens
  ),
  deferSnapshots: false,
  snapshots: [] as ((rows: Token[]) => void)[],
  emit(event: string, token: Token) {
    handlers.get(event)?.({ payload: { record: token, old_record: token } })
  },
  reconnect() {
    status?.('SUBSCRIBED')
  },
  save(id: string, x: number, y: number) {
    const updated_at = `2030-01-01T00:00:00.${String(++revision).padStart(6, '0')}Z`
    const current = this.rows.find((token) => token.id === id)!
    const token = { ...current, x, y, updated_at }
    this.rows = this.rows.map((row) => (row.id === id ? token : row))
    this.emit('UPDATE', token)
    return { x, y, updated_at }
  },
}
Object.assign(window, { __tokenLab: tokenTransport })
export function createClient() {
  const channel = {
    on(_type: string, { event }: { event: string }, handler: (payload: unknown) => void) {
      handlers.set(event, handler)
      return channel
    },
    subscribe(callback: (state: string) => void) {
      status = callback
      callback('SUBSCRIBED')
      return channel
    },
  }
  return {
    realtime: { setAuth: async () => {} },
    channel: () => channel,
    removeChannel: () => {
      handlers.clear()
      status = undefined
    },
    from: () => ({
      select: () => ({
        eq: async () => {
          const rows = tokenTransport.deferSnapshots
            ? await new Promise<Token[]>((resolve) => tokenTransport.snapshots.push(resolve))
            : structuredClone(tokenTransport.rows)
          return { data: rows, error: null }
        },
      }),
    }),
  }
}
