export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getScene } from '@/lib/queries/scenes'
import { getSceneTokens } from '@/lib/queries/tokens'
import { getInitiative } from '@/lib/queries/initiative'
import { getFogAreas } from '@/lib/queries/fog'
import { Breadcrumbs } from '@/components/breadcrumbs'
import SceneView from './scene-view'
import type { Character, Entity } from '@/lib/types'

export default async function ScenePage({
  params,
}: {
  params: Promise<{ id: string; sceneId: string }>
}) {
  await connection()

  const { id: campaignId, sceneId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const scene = await getScene(sceneId)
  if (!scene || scene.campaign_id !== campaignId) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Параллельная загрузка
  const [tokens, charactersRes, monstersRes, initiative, fog] = await Promise.all([
    getSceneTokens(sceneId),
    supabase
      .from('characters')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('type', 'monster')
      .order('name'),
    getInitiative(sceneId),
    getFogAreas(sceneId),
  ])

  const characters = (charactersRes.data ?? []) as Character[]
  const monsters = (monstersRes.data ?? []) as Entity[]

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Сцены', href: `/campaign/${campaignId}/scenes` },
          { label: scene.name },
        ]}
        className="mb-4"
      />

      <SceneView
        scene={scene}
        tokens={tokens}
        characters={characters}
        monsters={monsters}
        initiative={initiative}
        initialFog={fog}
        campaignId={campaignId}
        isDm={isDm}
        currentUserId={user?.id ?? null}
      />
    </div>
  )
}
