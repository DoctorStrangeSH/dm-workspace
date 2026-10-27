export const instant = false

import { connection } from 'next/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCampaignAccess } from '@/lib/queries/access'
import { getCampaignStats } from '@/lib/queries/stats'
import { getActiveScene } from '@/lib/queries/scenes'
import { Breadcrumbs } from '@/components/breadcrumbs'
import CampaignStatsGrid from './stats/campaign-stats-grid'
import EntitiesBreakdown from './stats/entities-breakdown'
import NeedsAttention from './stats/needs-attention'
import RecentActivity from './stats/recent-activity'
import { Crown, Map, Sword, BookOpen, Calendar, Library, ArrowRight, Compass, Sparkles } from 'lucide-react'
import { Badge, EmptyState } from '@/components/ui'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { id } = await params
  const { campaign, isDm } = await getCampaignAccess(id)

  if (!campaign) notFound()

  const [stats, activeScene] = await Promise.all([
    getCampaignStats(id),
    isDm ? getActiveScene(id) : Promise.resolve(null),
  ])

  const quickActions = [
    { href: `/campaign/${id}/scenes`, label: t('nav.scenes'), icon: Map },
    { href: `/campaign/${id}/characters`, label: t('nav.characters'), icon: Sword },
    { href: `/campaign/${id}/chapters`, label: t('nav.chapters'), icon: BookOpen },
    { href: `/campaign/${id}/sessions`, label: t('nav.sessions'), icon: Calendar },
    { href: `/campaign/${id}/bestiary`, label: t('nav.bestiary'), icon: Library },
  ]

  return (
    <div className="max-w-5xl">
      <Breadcrumbs
        items={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: campaign.name }]}
        className="mb-4"
      />

      <section className="relative mb-7 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(125deg,var(--bg-primary),var(--bg-secondary))] p-5 shadow-[var(--shadow-md)] sm:p-8" aria-labelledby="campaign-overview-title">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[var(--accent)]/15">
          <div className="absolute inset-8 rounded-full border border-[var(--accent)]/15" />
          <div className="absolute inset-20 rotate-45 border border-[var(--accent)]/10" />
          <Sparkles className="absolute bottom-12 left-9 h-6 w-6 text-[var(--accent)]/30" />
        </div>
        <div className="relative max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)]">
              <Compass size={14} aria-hidden="true" />
              {lang === 'en' ? 'Campaign workspace' : 'Мир кампании'}
            </span>
            {isDm && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--warning)]/25 bg-[var(--warning-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--warning-text)]">
                <Crown size={13} aria-hidden="true" />
                {t('campaign.dmBanner')}
              </span>
            )}
          </div>
          <h1 id="campaign-overview-title" className="break-words text-3xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {campaign.name}
          </h1>
          {campaign.genre && (
            <div className="mt-3">
              <Badge variant="accent" size="md">{campaign.genre}</Badge>
            </div>
          )}
          {campaign.description ? (
            <p className="mt-4 max-w-xl whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              {campaign.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {lang === 'en' ? 'Your stories, characters, and scenes in one place.' : 'Истории, персонажи и сцены — в одном месте.'}
            </p>
          )}
        </div>
      </section>

      {isDm && (
        <section className="mb-8" aria-labelledby="dm-quick-actions-title">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="dm-quick-actions-title" className="text-lg font-semibold text-[var(--text-primary)]">
              {lang === 'en' ? 'DM quick actions' : 'Быстрые действия мастера'}
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {lang === 'en' ? 'Everything for your session' : 'Всё для проведения сессии'}
            </span>
          </div>

          {activeScene && (
            <Link
              href={`/campaign/${id}/scenes/${activeScene.id}`}
              className="group mb-3 flex items-center gap-3 rounded-2xl border border-[var(--accent)]/35 bg-[linear-gradient(110deg,var(--accent-subtle),var(--bg-surface))] p-4 transition-all hover:border-[var(--accent)]/65 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--accent-text)]">
                <Map size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--accent-text)]">
                  {lang === 'en' ? 'Open active scene' : 'Открыть активную сцену'}
                </div>
                <div className="truncate font-semibold text-[var(--text-primary)]">{activeScene.name}</div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
            </Link>
          )}

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label={lang === 'en' ? 'DM shortcuts' : 'Быстрые переходы мастера'}>
            {quickActions.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-24 flex-col items-start justify-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-4 text-sm font-medium text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <Icon size={19} className="text-[var(--accent-text)]" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </section>
      )}

      {stats && (
        <>
          <CampaignStatsGrid campaignId={id} stats={stats} />
          <EntitiesBreakdown campaignId={id} stats={stats.entities} />
          {isDm && <NeedsAttention campaignId={id} stats={stats} />}
          <RecentActivity campaignId={id} recent={stats.recent} />
        </>
      )}

      {!stats ||
        (stats.chapters.total === 0 && stats.entities.total === 0 && (
          <EmptyState
            icon="🏰"
            title={t('campaign.empty.title')}
            description={
              isDm ? t('campaign.empty.descriptionDm') : t('campaign.empty.descriptionPlayer')
            }
            size="lg"
          />
        ))}
    </div>
  )
}
