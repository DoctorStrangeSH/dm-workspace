export const instant = false

import { connection } from 'next/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCampaignAccess } from '@/lib/queries/access'
import { createClient } from '@/lib/supabase/server'
import { getCampaignMessages } from '@/lib/queries/messages'
import CampaignSidebar from './campaign-sidebar'
import MobileSidebar from './mobile-sidebar'
import { DmScreenProvider } from './dm-screen/dm-screen-context'
import DmScreen from './dm-screen/dm-screen'
import CommandPaletteWrapper from './command-palette/command-palette-wrapper'
import ChatPanel from './chat/chat-panel'
import ThemeToggle from '@/components/theme-toggle'
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

  // Загружаем данные для палитры и DM Screen
  let entities: Entity[] = []
  let chapters: Chapter[] = []

  if (role === 'dm') {
    const [entitiesRes, chaptersRes] = await Promise.all([
      supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', id)
        .order('name'),
      supabase
        .from('chapters')
        .select('*')
        .eq('campaign_id', id)
        .order('order_index'),
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

  // Загружаем сообщения чата
  const messages = await getCampaignMessages(id, 50)

  return (
    <DmScreenProvider>
      <div className="min-h-screen">
        <header
          className="border-b sticky top-0 z-30 backdrop-blur"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor:
              'color-mix(in srgb, var(--bg-app) 95%, transparent)',
          }}
        >
          <div className="px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-4">
            <MobileSidebar campaignId={id} isDm={role === 'dm'} />

            <Link
              href="/dashboard"
              className="hidden md:flex p-2 hover:bg-slate-800 rounded-lg transition"
              title="Назад к кампаниям"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">
                {campaign.name}
              </h1>
              {campaign.genre && (
                <p
                  className="text-xs truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {campaign.genre} · {role === 'dm' ? 'ГМ' : 'Игрок'}
                </p>
              )}
            </div>

            <ThemeToggle />

            <CommandPaletteWrapper
              campaignId={id}
              campaignName={campaign.name}
              chapters={chapters}
              entities={entities}
            />
          </div>
        </header>

        <div className="flex">
          <CampaignSidebar campaignId={campaign.id} isDm={role === 'dm'} />
          <main className="flex-1 min-w-0 p-3 sm:p-6">{children}</main>
        </div>

        {role === 'dm' && (
          <DmScreen entities={entities} campaignId={campaign.id} />
        )}

        {/* Чат */}
        {user && (
          <ChatPanel
            campaignId={id}
            messages={messages}
            currentUserId={user.id}
            isDm={role === 'dm'}
          />
        )}
      </div>
    </DmScreenProvider>
  )
}