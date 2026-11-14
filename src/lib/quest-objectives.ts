export interface QuestObjective {
  id: string
  text: string
  done: boolean
}

export const MAX_QUEST_OBJECTIVES = 20
export const MAX_OBJECTIVE_TEXT = 200

/** Missing data is a legacy empty list; malformed data must never be silently replaced. */
export function readQuestObjectives(value: unknown): QuestObjective[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_QUEST_OBJECTIVES) return null
  const ids = new Set<string>()
  const result: QuestObjective[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const { id, text, done } = item as Record<string, unknown>
    if (
      typeof id !== 'string' ||
      !/^[\w-]{1,64}$/.test(id) ||
      ids.has(id) ||
      typeof text !== 'string' ||
      !text.trim() ||
      text.length > MAX_OBJECTIVE_TEXT ||
      typeof done !== 'boolean' ||
      Object.keys(item).some((key) => !['id', 'text', 'done'].includes(key))
    )
      return null
    ids.add(id)
    result.push({ id, text, done })
  }
  return result
}
