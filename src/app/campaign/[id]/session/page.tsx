export const instant = false

import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getScenes } from '@/lib/queries/scenes'
import { getSceneTokens } from '@/lib/queries/tokens'
import { getInitiative } from '@/lib/queries/initiative'
import { getFogAreas } from '@/lib/queries/fog'
import { getSceneWalls } from '@/lib/queries/walls'
import { getTokenOwners } from '@/lib/queries/token-owners'
import { getCampaignMessages } from '@/lib/queries/messages'
import { SessionChapterPanel } from './session-chapter-panel'
import { SessionScenePanel } from './session-scene-panel'
import { SessionChatPanel } from './session-chat-panel'
import type { Chapter, Character, Entity } from '@/lib/types'

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ chapter?: string; scene?: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { chapter: chapterParam, scene: sceneParam } = await searchParams

  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)
  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')
  if (!isDm) redirect(`/campaign/${campaignId}`)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Главы — прямым запросом (нет lib/queries/chapters.ts)
  const [chaptersRes, scenes] = await Promise.all([
    supabase
      .from('chapters')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index', { ascending: true }),
    getScenes(campaignId),
  ])

  const chapters = (chaptersRes.data ?? []) as Chapter[]

  const activeChapterId = chapterParam ?? chapters[0]?.id ?? null
  const activeSceneId = sceneParam ?? scenes.find((s) => s.is_active)?.id ?? scenes[0]?.id ?? null

  const activeChapter = activeChapterId
    ? (chapters.find((c) => c.id === activeChapterId) ?? null)
    : null
  const activeScene = activeSceneId ? (scenes.find((s) => s.id === activeSceneId) ?? null) : null

  let sceneTokens: Awaited<ReturnType<typeof getSceneTokens>> = []
  let sceneCharacters: Character[] = []
  let sceneMonsters: Entity[] = []
  let sceneInitiative: Awaited<ReturnType<typeof getInitiative>> = []
  let sceneFog: Awaited<ReturnType<typeof getFogAreas>> = []
  let sceneWalls: Awaited<ReturnType<typeof getSceneWalls>> = []
  let sceneTokenOwners: Awaited<ReturnType<typeof getTokenOwners>> = []

  if (activeScene) {
    const [tokensRes, charactersRes, monstersRes, initiativeRes, fogRes, wallsRes, ownersRes] =
      await Promise.all([
        getSceneTokens(activeScene.id),
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
        getInitiative(activeScene.id),
        getFogAreas(activeScene.id),
        getSceneWalls(activeScene.id),
        getTokenOwners(activeScene.id),
      ])

    sceneTokens = tokensRes
    sceneCharacters = (charactersRes.data ?? []) as Character[]
    sceneMonsters = (monstersRes.data ?? []) as Entity[]
    sceneInitiative = initiativeRes
    sceneFog = fogRes
    sceneWalls = wallsRes
    sceneTokenOwners = ownersRes
  }

  const messages = await getCampaignMessages(campaignId, 50)

  return (
    <>
      <div className="flex min-h-0 flex-col border-r border-[var(--border-default)]">
        <Suspense fallback={null}>
          <SessionChapterPanel
            campaignId={campaignId}
            chapters={chapters}
            activeChapter={activeChapter}
          />
        </Suspense>
      </div>

      <div className="flex min-h-0 flex-col border-r border-[var(--border-default)]">
        <Suspense fallback={null}>
          <SessionScenePanel
            campaignId={campaignId}
            scenes={scenes}
            activeScene={activeScene}
            tokens={sceneTokens}
            characters={sceneCharacters}
            monsters={sceneMonsters}
            initiative={sceneInitiative}
            initialFog={sceneFog}
            initialWalls={sceneWalls}
            initialTokenOwners={sceneTokenOwners}
            currentUserId={user?.id ?? null}
          />
        </Suspense>
      </div>

      <SessionChatPanel
        campaignId={campaignId}
        initialMessages={messages}
        currentUserId={user?.id ?? null}
        isDm={isDm}
      />
    </>
  )
}
