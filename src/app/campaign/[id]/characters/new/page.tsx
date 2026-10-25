export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getSrdSpecies, getSrdClasses } from '@/lib/queries/srd'
import { Breadcrumbs } from '@/components/breadcrumbs'
import CharacterWizard from './character-wizard'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

export default async function NewCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { id: campaignId } = await params
  const { campaign, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const [species, classes] = await Promise.all([getSrdSpecies(), getSrdClasses()])

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.characters'), href: `/campaign/${campaignId}/characters` },
          { label: t('characters.new') },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('characters.new')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('characters.wizard.subtitle')}</p>
      </div>

      <CharacterWizard campaignId={campaignId} species={species} classes={classes} />
    </div>
  )
}
