export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { searchSrdSpellsAction } from '@/lib/actions/spells-search'
import { Breadcrumbs } from '@/components/breadcrumbs'
import SpellsClient from './spells-client'

export default async function SpellsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const initialSpells = await searchSrdSpellsAction({ limit: 100 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let characters: Array<{ id: string; name: string }> = []
  if (user) {
    const { data } = await supabase
      .from('characters')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .eq('is_active', true)
    characters = data ?? []
  }

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Заклинания' },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Справочник заклинаний</h1>
        <p className="text-slate-400 text-sm mt-1">
          Поиск заклинаний SRD 2024. Добавь заклинание своему персонажу.
        </p>
      </div>

      <SpellsClient
        campaignId={campaignId}
        initialSpells={initialSpells}
        characters={characters}
        canEdit={characters.length > 0}
      />
    </div>
  )
}