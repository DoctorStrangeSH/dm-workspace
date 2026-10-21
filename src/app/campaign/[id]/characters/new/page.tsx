export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getSrdSpecies, getSrdClasses } from '@/lib/queries/srd'
import { Breadcrumbs } from '@/components/breadcrumbs'
import CharacterWizard from './character-wizard'

export default async function NewCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const [species, classes] = await Promise.all([getSrdSpecies(), getSrdClasses()])

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Персонажи', href: `/campaign/${campaignId}/characters` },
          { label: 'Новый персонаж' },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Новый персонаж</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Создай героя за 4 шага</p>
      </div>

      <CharacterWizard campaignId={campaignId} species={species} classes={classes} />
    </div>
  )
}
