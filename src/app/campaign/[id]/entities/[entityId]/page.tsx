export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import {
  getEntityBacklinks,
  getEntityRelations,
  getEntityTags,
  getCampaignTags,
  getLocationPath,
  getLocationDescendants,
} from '@/lib/queries/backlinks'
import EntityDetail from './entity-detail'
import type { Entity } from '@/lib/types'

export default async function EntityPage({
  params,
}: {
  params: Promise<{ id: string; entityId: string }>
}) {
  await connection()

  const { id: campaignId, entityId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()
  const { data: entity, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .eq('campaign_id', campaignId)
    .single()

  if (error || !entity) notFound()

  const e = entity as Entity

  if (!isDm && !e.is_visible_to_players) notFound()

  const isLocation = e.type === 'location'

  const [
    backlinks,
    relations,
    entityTags,
    availableTags,
    allEntitiesRes,
    locationPath,
    locationDescendants,
  ] = await Promise.all([
    getEntityBacklinks(entityId),
    getEntityRelations(entityId),
    getEntityTags(entityId),
    getCampaignTags(campaignId),
    supabase.from('entities').select('*').eq('campaign_id', campaignId).order('name'),
    isLocation ? getLocationPath(entityId) : Promise.resolve([]),
    isLocation ? getLocationDescendants(entityId) : Promise.resolve([]),
  ])

  const allEntities = (allEntitiesRes.data ?? []) as Entity[]

  return (
    <div className="max-w-3xl">
      <EntityDetail
        entity={e}
        campaign={campaign}
        campaignId={campaignId}
        isDm={isDm}
        backlinks={backlinks}
        relations={relations}
        allEntities={allEntities}
        entityTags={entityTags}
        availableTags={availableTags}
        locationPath={locationPath}
        locationDescendants={locationDescendants}
      />
    </div>
  )
}
