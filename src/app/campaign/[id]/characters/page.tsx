export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCampaignAccess } from '@/lib/queries/access'
import { getCampaignCharacters } from '@/lib/queries/characters'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { EmptyState, Card } from '@/components/ui'
import CreateCharacterButton from './create-character-button'
import { Sword, ArrowUpRight, Shield, Heart, Sparkles, Users } from 'lucide-react'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import { pluralize } from '@/lib/i18n/plural'

export default async function CharactersPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const characters = await getCampaignCharacters(campaignId)

  const countLabel = pluralize(lang, characters.length, {
    one: t('characters.count.one'),
    few: t('characters.count.few'),
    many: t('characters.count.many'),
  })

  return (
    <div className="max-w-5xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: t('nav.characters') },
        ]}
        className="mb-4"
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(115deg,var(--bg-primary),var(--bg-secondary))] p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border border-[var(--accent)]/20">
          <div className="absolute inset-8 rounded-full border border-[var(--accent)]/15" />
          <Sparkles size={22} className="absolute bottom-8 left-7 text-[var(--accent)]/30" />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            <Sword size={22} className="text-[var(--warning)]" />
            {t('nav.characters')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {characters.length} {countLabel}
          </p>
        </div>
        <CreateCharacterButton campaignId={campaignId} />
        </div>
      </div>

      {characters.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title={t('characters.empty.title')}
          description={
            isDm ? t('characters.empty.descriptionDm') : t('characters.empty.descriptionPlayer')
          }
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map((char) => {
            const hp = char.data_json.hp
            const hpPercent = hp && hp.max > 0
              ? Math.min(100, Math.max(0, (hp.current / hp.max) * 100))
              : 0
            return (
              <Link
                key={char.id}
                href={`/campaign/${campaignId}/characters/${char.id}`}
                className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <Card padding="none" hoverable className="relative flex h-full min-h-64 flex-col overflow-hidden rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--accent)]/40 group-hover:shadow-[var(--shadow-md)]">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(110deg,var(--bg-elevated),var(--bg-secondary))]">
                    <div className="absolute -right-5 -top-10 h-36 w-36 rounded-full border border-[var(--accent)]/15" />
                    <div className="absolute right-6 top-1 h-24 w-24 rotate-45 border border-[var(--accent)]/10" />
                  </div>
                  <div className="relative flex flex-1 flex-col p-4 sm:p-5">
                    <div className="mb-5 flex items-start justify-between gap-2">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--bg-primary)] text-[var(--accent-text)]">
                        <Sword size={23} aria-hidden="true" />
                      </div>
                      <ArrowUpRight size={19} className="mt-1 text-[var(--text-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                    <h3 className="break-words text-lg font-semibold leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-text)]">
                      {char.name}
                    </h3>
                    <p className="mt-2 flex flex-wrap items-center gap-x-1 text-xs leading-relaxed text-[var(--text-muted)]">
                      {char.data_json.race && <span className="capitalize">{char.data_json.race}</span>}
                      {char.data_json.race && char.data_json.class && <span aria-hidden="true">·</span>}
                      {char.data_json.class && <span className="capitalize">{char.data_json.class}</span>}
                      <span aria-hidden="true">·</span>
                      <span>{t('characters.level', { level: char.data_json.level ?? 1 })}</span>
                    </p>
                    <div className="mt-auto pt-4">
                      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-subtle)]">
                        <Users size={14} className="shrink-0" aria-hidden="true" />
                        <span className="min-w-0 truncate">{t('characters.owner')}: {char.owner.display_name ?? char.owner.username}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-default)] pt-3">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Shield size={15} className="text-[var(--info-text)]" aria-hidden="true" />
                          <span>AC {char.data_json.ac ?? '—'}</span>
                        </div>
                        <div className="flex min-w-0 items-center justify-end gap-2 text-sm text-[var(--text-secondary)]">
                          <Heart size={15} className="shrink-0 text-[var(--danger-text)]" aria-hidden="true" />
                          <span className="truncate">{hp ? `${hp.current} / ${hp.max}` : '—'}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]" aria-label={hp ? `HP ${hp.current} из ${hp.max}` : undefined} role={hp ? 'img' : undefined}>
                        {hp && <div className="h-full rounded-full bg-[var(--success)] transition-[width]" style={{ width: `${hpPercent}%` }} />}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
