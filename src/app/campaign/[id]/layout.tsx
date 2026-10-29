export const instant = false

import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect, notFound } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { createClient } from '@/lib/supabase/server'
import { getCampaignMessages } from '@/lib/queries/messages'
import { getPlaylists, getMusicState, getCurrentTrack } from '@/lib/queries/music'
import { getHandouts } from '@/lib/queries/handouts'
import { getSessionLog } from '@/lib/queries/logs'
import CampaignSidebar from './campaign-sidebar'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { DmScreenProvider } from './dm-screen/dm-screen-context'
import DmScreen from './dm-screen/dm-screen'
import CommandPaletteWrapper from './command-palette/command-palette-wrapper'
import ChatPanel from './chat/chat-panel'
import PresenceBadge from './presence-badge'
import MusicButton from './music/music-button'
import { MusicPlayer } from './music/music-player'
import HandoutButton from './handouts/handout-button'
import { HandoutViewer } from './handouts/handout-viewer'
import SessionLogButton from './logs/session-log-button'
import ThemeToggle from '@/components/theme-toggle'
import { LangToggle } from '@/components/ui'
import { SessionModeToggle } from './session-mode-toggle'
import { CampaignShell } from './campaign-tools'
import { CampaignHeader } from './campaign-header'
import type { Entity, Chapter } from '@/lib/types'

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const { campaign, role, isMember } = await getCampaignAccess(id)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { display_name: string | null; username: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()
    profile = data
  }

  let entities: Entity[] = []
  let chapters: Chapter[] = []

  if (role === 'dm') {
    const [entitiesRes, chaptersRes] = await Promise.all([
      supabase.from('entities').select('*').eq('campaign_id', id).order('name'),
      supabase.from('chapters').select('*').eq('campaign_id', id).order('order_index'),
    ])
    entities = (entitiesRes.data ?? []) as Entity[]
    chapters = (chaptersRes.data ?? []) as Chapter[]
  } else {
    const [entitiesRes, chaptersRes] = await Promise.all([
      supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', id)
        .eq('is_visible_to_players', true)
        .order('name'),
      supabase
        .from('chapters')
        .select('*')
        .eq('campaign_id', id)
        .eq('is_visible_to_players', true)
        .order('order_index'),
    ])
    entities = (entitiesRes.data ?? []) as Entity[]
    chapters = (chaptersRes.data ?? []) as Chapter[]
  }

  const [messages, playlists, playerState, currentTrack, handouts, sessionLog] = await Promise.all([
    getCampaignMessages(id, 50),
    getPlaylists(id),
    getMusicState(id),
    getCurrentTrack(id),
    getHandouts(id),
    getSessionLog(id, 100),
  ])

  return (
    <DmScreenProvider>
      <CampaignShell>
        <CampaignHeader
          campaignId={id}
          name={campaign.name}
          genre={campaign.genre}
          isDm={role === 'dm'}
          preferences={
            <>
              <Suspense fallback={null}>
                <LangToggle />
              </Suspense>
              <ThemeToggle />
            </>
          }
          search={
            <CommandPaletteWrapper
              campaignId={id}
              campaignName={campaign.name}
              chapters={chapters}
              entities={entities}
            />
          }
          actions={
            <>
              {role === 'dm' && (
                <>
                  <MusicButton campaignId={id} playlists={playlists} playerState={playerState} />
                  <HandoutButton campaignId={id} handouts={handouts} />
                  <SessionModeToggle campaignId={id} />
                </>
              )}
              <SessionLogButton campaignId={id} log={sessionLog} isDm={role === 'dm'} />
            </>
          }
          presence={
            user && profile ? (
              <PresenceBadge
                campaignId={id}
                currentUserId={user.id}
                currentUserName={profile.display_name ?? profile.username}
              />
            ) : null
          }
        />

        <div className="flex">
          <CampaignSidebar campaignId={campaign.id} isDm={role === 'dm'} />
          <main className="min-w-0 flex-1 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
            {children}
          </main>
        </div>

        <MobileBottomNav campaignId={campaign.id} />

        {role === 'dm' && <DmScreen entities={entities} campaignId={campaign.id} />}

        {user && (
          <ChatPanel
            campaignId={id}
            initialMessages={messages}
            currentUserId={user.id}
            isDm={role === 'dm'}
          />
        )}

        <MusicPlayer campaignId={id} initialState={playerState} currentTrack={currentTrack} />

        <HandoutViewer campaignId={id} initialHandouts={handouts} />
      </CampaignShell>
    </DmScreenProvider>
  )
}
