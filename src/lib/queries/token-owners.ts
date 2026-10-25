import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { TokenOwnerWithProfile } from '@/lib/types'

export async function getTokenOwners(sceneId: string): Promise<TokenOwnerWithProfile[]> {
  const supabase = await createClient()

  // Получаем все токены сцены
  const { data: tokens } = await supabase.from('tokens').select('id').eq('scene_id', sceneId)

  if (!tokens || tokens.length === 0) return []

  const tokenIds = tokens.map((t) => t.id)

  const { data, error } = await supabase
    .from('token_owners')
    .select(
      `
      *,
      profile:profiles!token_owners_user_id_fkey(id, username, display_name)
    `
    )
    .in('token_id', tokenIds)

  if (error) {
    console.error('getTokenOwners error:', { code: error.code, message: error.message })
    return []
  }

  return (data ?? []) as TokenOwnerWithProfile[]
}
