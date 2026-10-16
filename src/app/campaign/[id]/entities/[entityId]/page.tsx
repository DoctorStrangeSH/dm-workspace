export const instant = false

import { connection } from 'next/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getEntityBacklinks } from '@/lib/queries/backlinks'
import { ArrowLeft } from 'lucide-react'
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

  // Загружаем беклинки
  const backlinks = await getEntityBacklinks(entityId)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/campaign/${campaignId}/entities`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          К сущностям
        </Link>
      </div>

      <EntityDetail
        entity={e}
        campaignId={campaignId}
        isDm={isDm}
        backlinks={backlinks}
      />
    </div>
  )
}