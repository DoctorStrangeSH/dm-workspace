export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getScene } from '@/lib/queries/scenes'
import { getSceneTokens } from '@/lib/queries/tokens'
import { getInitiative } from '@/lib/queries/initiative'
import { getFogAreas } from '@/lib/queries/fog'
import { getSceneWalls } from '@/lib/queries/walls'
import { getPendingSummonRequests } from '@/lib/queries/summon'
import { getTokenOwners } from '@/lib/queries/token-owners'
import { Breadcrumbs } from '@/components/breadcrumbs'
import SceneView from './scene-view'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import type { Character, Entity } from '@/lib/types'

export default async function ScenePage({
  params,
}: {
  params: Promise<{ id: string; sceneId: string }>
}) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

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

  const [
    tokens,
    charactersRes,
    monstersRes,
    initiative,
    fog,
    walls,
    summonRequests,
    tokenOwners,
    membersRes,
  ] = await Promise.all([
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
    getSceneWalls(sceneId),
    isDm ? getPendingSummonRequests(campaignId) : Promise.resolve([]),
    getTokenOwners(sceneId),
    isDm
      ? supabase
          .from('campaign_members')
          .select(
            `
            user_id,
            profiles!campaign_members_user_id_fkey (username, display_name)
          `
          )
          .eq('campaign_id', campaignId)
      : Promise.resolve({ data: [], error: null }),
  ])

  const characters = (charactersRes.data ?? []) as Character[]
  const monsters = (monstersRes.data ?? []) as Entity[]

  // CHANGES: profiles может быть массивом (Supabase join) — нормализуем.
  const campaignMembers = (membersRes.data ?? []).map(
    (m: {
      user_id: string
      profiles:
        | { username: string; display_name: string | null }
        | { username: string; display_name: string | null }[]
        | null
    }) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      return {
        user_id: m.user_id,
        username: p?.username ?? '',
        display_name: p?.display_name ?? null,
      }
    }
  )

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.scenes'), href: `/campaign/${campaignId}/scenes` },
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
        initialWalls={walls}
        initialSummonRequests={summonRequests}
        initialTokenOwners={tokenOwners}
        campaignMembers={campaignMembers}
        campaignId={campaignId}
        isDm={isDm}
        currentUserId={user?.id ?? null}
      />
    </div>
  )
}
