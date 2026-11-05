type Ordered = { id: string; turn_order: number }
export function orderTurns<T extends Ordered>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.turn_order - b.turn_order || a.id.localeCompare(b.id))
}
export function nextTurnEntry<T extends Ordered>(
  entries: T[],
  currentId: string | null
): T | undefined {
  const ordered = orderTurns(entries)
  const index = ordered.findIndex((entry) => entry.id === currentId)
  return ordered[(index + 1) % ordered.length]
}
