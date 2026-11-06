export type TokenPosition = { x: number; y: number; updated_at: string }

/** Postgres timestamps carry microseconds; Date.parse alone loses their ordering. */
export function compareTokenRevision(a: string, b: string) {
  const milliseconds = Date.parse(a) - Date.parse(b)
  if (Number.isFinite(milliseconds) && milliseconds !== 0) return Math.sign(milliseconds)
  const remainder = (value: string) => (value.match(/\.(\d+)/)?.[1] ?? '').padEnd(6, '0').slice(3)
  return remainder(a).localeCompare(remainder(b))
}

type Result = { position: TokenPosition; error?: never } | { error: string; position?: never }

/** One writer per mounted token: coalesce queued intent, never send overlapping moves. */
export class TokenMovement {
  private authoritative: TokenPosition
  private queued: { x: number; y: number } | null = null
  private saving = false
  private disposed = false
  private uncertain = false
  position: { x: number; y: number }

  constructor(
    initial: TokenPosition,
    private save: (position: { x: number; y: number }) => Promise<Result>,
    private paint: (position: { x: number; y: number }) => void,
    private fail: (error: string | null) => void
  ) {
    this.authoritative = initial
    this.position = initial
  }

  receive(position: TokenPosition) {
    const revision = compareTokenRevision(position.updated_at, this.authoritative.updated_at)
    if (revision < 0) return
    this.authoritative = position
    if (this.uncertain && revision > 0) this.uncertain = false
    if (!this.saving && !this.uncertain) this.show(position)
  }

  private show(position: { x: number; y: number }) {
    this.position = { x: position.x, y: position.y }
    if (!this.disposed) this.paint(this.position)
  }

  move(position: { x: number; y: number }) {
    this.queued = position
    this.uncertain = false
    this.show(position)
    if (!this.saving) void this.drain()
  }

  private async drain() {
    this.saving = true
    while (this.queued) {
      const next = this.queued
      this.queued = null
      try {
        const result = await this.save(next)
        if (result.error !== undefined) {
          if (!this.disposed) this.fail(result.error)
        } else if (
          compareTokenRevision(result.position.updated_at, this.authoritative.updated_at) >= 0
        ) {
          this.authoritative = result.position
        }
      } catch {
        // A lost response is not proof of a rejected write. Keep the latest local intent
        // until a newer authoritative event arrives; do not auto-retry.
        this.uncertain = true
        this.queued = null
        if (!this.disposed) this.fail(null)
        break
      }
    }
    this.saving = false
    if (!this.uncertain) this.show(this.authoritative)
  }

  dispose() {
    this.disposed = true
  }

  activate() {
    this.disposed = false
  }

  setCallbacks(
    paint: (position: { x: number; y: number }) => void,
    fail: (error: string | null) => void
  ) {
    this.paint = paint
    this.fail = fail
  }
}
