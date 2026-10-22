import { createClient } from '@/lib/supabase/server'
import type { InitiativeEntryWithToken, Token } from '@/lib/types'

export async function getInitiative(sceneId: string): Promise<InitiativeEntryWithToken[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('initiative')
    .select(
      `
      *,
      token:tokens (*)
    `
    )
    .eq('scene_id', sceneId)
    .order('turn_order')

  if (error) {
    console.error('getInitiative error:', error)
    return []
  }

  const entries = (data ?? []).map((row) => {
    const token = Array.isArray(row.token) ? row.token[0] : row.token
    return {
      ...row,
      token: token as Token,
    } as InitiativeEntryWithToken
  })

  // CHANGES: подтягиваем AC для токенов (из characters / entities).
  return attachAC(supabase, entries)
}

/**
 * Добавляет AC к токенам (join с characters / entities).
 * Возвращает копию entries с token.ac (если найден).
 */
async function attachAC(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entries: InitiativeEntryWithToken[]
): Promise<InitiativeEntryWithToken[]> {
  const characterIds = entries.map((e) => e.token.character_id).filter((id): id is string => !!id)
  const entityIds = entries.map((e) => e.token.entity_id).filter((id): id is string => !!id)

  const [charsRes, entitiesRes] = await Promise.all([
    characterIds.length > 0
      ? supabase.from('characters').select('id, data_json').in('id', characterIds)
      : Promise.resolve({ data: [] as { id: string; data_json: unknown }[] }),
    entityIds.length > 0
      ? supabase.from('entities').select('id, data_json').in('id', entityIds)
      : Promise.resolve({ data: [] as { id: string; data_json: unknown }[] }),
  ])

  const acByCharacterId = new Map<string, number>()
  for (const row of charsRes.data ?? []) {
    const dj = row.data_json as { ac?: number } | null
    if (typeof dj?.ac === 'number') acByCharacterId.set(row.id, dj.ac)
  }

  const acByEntityId = new Map<string, number>()
  for (const row of entitiesRes.data ?? []) {
    const dj = row.data_json as { ac?: number } | null
    if (typeof dj?.ac === 'number') acByEntityId.set(row.id, dj.ac)
  }

  return entries.map((entry) => {
    const ac =
      (entry.token.character_id ? acByCharacterId.get(entry.token.character_id) : undefined) ??
      (entry.token.entity_id ? acByEntityId.get(entry.token.entity_id) : undefined) ??
      null

    return {
      ...entry,
      token: {
        ...entry.token,
        ac,
      },
    } as InitiativeEntryWithToken
  })
}
