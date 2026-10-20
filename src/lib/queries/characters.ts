import { createClient } from '@/lib/supabase/server'
import type { Character, CharacterWithOwner } from '@/lib/types'

/**
 * Возвращает всех персонажей кампании (с владельцем).
 */
export async function getCampaignCharacters(campaignId: string): Promise<CharacterWithOwner[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('characters')
    .select(
      `
      *,
      owner:profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('campaign_id', campaignId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('getCampaignCharacters error:', error)
    return []
  }

  return (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner
    return {
      ...row,
      owner,
    } as CharacterWithOwner
  })
}

/**
 * Возвращает персонажей текущего игрока в кампании.
 */
export async function getMyCharacters(campaignId: string): Promise<Character[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name')

  if (error) return []
  return (data ?? []) as Character[]
}

/**
 * Возвращает одного персонажа.
 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (error) return null
  return data as Character
}

/**
 * Возвращает персонажа с информацией о владельце.
 */
export async function getCharacterWithOwner(
  characterId: string
): Promise<(Character & { owner: { display_name: string | null; username: string } }) | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('characters')
    .select(
      `
      *,
      owner:profiles (
        display_name,
        username
      )
    `
    )
    .eq('id', characterId)
    .single()

  if (error || !data) return null

  const owner = Array.isArray(data.owner) ? data.owner[0] : data.owner
  return { ...data, owner }
}
