import { mapInitiative } from './maps-data'

type Result = { data: unknown[] | null; error: { message: string } | null }
type Request = {
  table: string
  scene: string | undefined
  ids: string[]
  orders: string[]
}
type Handler = { table: string; callback: (payload: unknown) => void }
const channels = new Set<{
  handlers: Handler[]
  status?: (status: string) => void
  removed: boolean
}>()

// In-memory read boundary for the real initiative hook. Never connects to Supabase.
export const initiativeTransport = {
  rows: structuredClone(mapInitiative) as unknown[],
  characters: [] as unknown[],
  entities: [] as unknown[],
  deferred: new Set(new URLSearchParams(location.search).has('deferred') ? ['initiative'] : []),
  requests: [] as Request[],
  pending: [] as {
    request: Request
    result: Result
    resolve: (result: Result) => void
    reject: (error: Error) => void
  }[],
  active: 0,
  maxActive: 0,
  removals: 0,
  emit(table: string, payload: unknown = {}) {
    for (const channel of channels)
      if (!channel.removed)
        for (const handler of channel.handlers)
          if (handler.table === table) handler.callback(payload)
  },
  status(status = 'SUBSCRIBED') {
    for (const channel of channels) if (!channel.removed) channel.status?.(status)
  },
  async query(request: Request): Promise<Result> {
    this.requests.push(request)
    this.maxActive = Math.max(this.maxActive, ++this.active)
    const rows =
      request.table === 'initiative'
        ? this.rows
        : request.table === 'characters'
          ? this.characters
          : this.entities
    const result = { data: structuredClone(rows), error: null }
    try {
      return this.deferred.has(request.table)
        ? await new Promise<Result>((resolve, reject) =>
            this.pending.push({ request, result, resolve, reject })
          )
        : result
    } finally {
      this.active--
    }
  },
}
Object.assign(window, { __initiativeLab: initiativeTransport })

export function createClient() {
  return {
    channel: () => {
      const record = {
        handlers: [] as Handler[],
        removed: false,
        status: undefined as ((status: string) => void) | undefined,
      }
      channels.add(record)
      const channel = {
        record,
        on(_type: string, filter: { table: string }, callback: (payload: unknown) => void) {
          record.handlers.push({ table: filter.table, callback })
          return channel
        },
        subscribe(callback: (status: string) => void) {
          record.status = callback
          callback('SUBSCRIBED')
          return channel
        },
      }
      return channel
    },
    removeChannel: (channel: { record: { removed: boolean } }) => {
      channel.record.removed = true
      initiativeTransport.removals++
    },
    from: (table: string) => {
      const request: Request = { table, scene: undefined, ids: [], orders: [] }
      const q = {
        select: () => q,
        eq(key: string, value: string) {
          if (key === 'scene_id') request.scene = value
          return q
        },
        in(_key: string, ids: string[]) {
          request.ids = ids
          return q
        },
        order(key: string) {
          request.orders.push(key)
          return q
        },
        then(resolve: (result: Result) => unknown, reject?: (error: unknown) => unknown) {
          return initiativeTransport.query(request).then(resolve, reject)
        },
      }
      return q
    },
  }
}
