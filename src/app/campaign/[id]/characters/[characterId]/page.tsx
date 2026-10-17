export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getCharacterWithOwner } from '@/lib/queries/characters'
import CharacterSheet from './character-sheet'

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string; characterId: string }>
}) {
  await connection()

  const { id: campaignId, characterId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const character = await getCharacterWithOwner(characterId)

  if (!character || character.campaign_id !== campaignId) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Права: ГМ или владелец
  const isOwner = character.user_id === user?.id
  const canEdit = isDm || isOwner

  // Если не ГМ и не владелец — проверяем видимость
  if (!canEdit && !character.is_visible_to_party) {
    notFound()
  }

  return (
    <CharacterSheet
      character={character}
      campaignId={campaignId}
      campaignName={campaign.name}
      owner={character.owner}
      canEdit={canEdit}
      isDm={isDm}
    />
  )
}