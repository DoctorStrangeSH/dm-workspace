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

  return (data ?? []).map((row) => {
    const token = Array.isArray(row.token) ? row.token[0] : row.token
    return {
      ...row,
      token: token as Token,
    } as InitiativeEntryWithToken
  })
}
