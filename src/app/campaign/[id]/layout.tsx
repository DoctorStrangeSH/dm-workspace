export const instant = false

import { connection } from 'next/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCampaignAccess } from '@/lib/queries/access'
import { createClient } from '@/lib/supabase/server'
import CampaignSidebar from './campaign-sidebar'
import { DmScreenProvider } from './dm-screen/dm-screen-context'
import DmScreen from './dm-screen/dm-screen'
import type { Entity } from '@/lib/types'

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

  // Для панели ГМа — все сущности кампании (только для ГМа)
  let entities: Entity[] = []
  if (role === 'dm') {
    const supabase = await createClient()
    const { data } = await supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', id)
      .order('name')
    entities = (data ?? []) as Entity[]
  }

  return (
    <DmScreenProvider>
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 sticky top-0 z-30 bg-slate-950/95 backdrop-blur">
          <div className="px-6 py-3 flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-800 rounded-lg transition"
              title="Назад к кампаниям"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{campaign.name}</h1>
              {campaign.genre && (
                <p className="text-xs text-slate-400 truncate">
                  {campaign.genre} · {role === 'dm' ? 'ГМ' : 'Игрок'}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="flex">
          <CampaignSidebar campaignId={campaign.id} isDm={role === 'dm'} />
          <main className="flex-1 min-w-0 p-6">{children}</main>
        </div>

        {/* Панель ГМа — только для ГМа */}
        {role === 'dm' && (
          <DmScreen entities={entities} campaignId={campaign.id} />
        )}
      </div>
    </DmScreenProvider>
  )
}