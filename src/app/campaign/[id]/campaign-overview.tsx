import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Compass,
  Crown,
  Map,
  MonitorPlay,
  Sparkles,
  Sword,
  Users,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/types'
import type { Campaign, CampaignStats } from '@/lib/types'
import CampaignStatsGrid from './stats/campaign-stats-grid'
import EntitiesBreakdown from './stats/entities-breakdown'
import NeedsAttention from './stats/needs-attention'
import RecentActivity from './stats/recent-activity'

export interface CampaignOverviewProps {
  campaign: Pick<Campaign, 'id' | 'name' | 'description' | 'genre'>
  isDm: boolean
  stats: CampaignStats | null
  activeScene: { id: string; name: string } | null
  lang: Lang
  now: number
}

/** Presentation only: access decisions and database reads stay in the server page. */
export default function CampaignOverview({
  campaign,
  isDm,
  stats,
  activeScene,
  lang,
  now,
}: CampaignOverviewProps) {
  const t = createT(getDictionary(lang))
  const base = `/campaign/${campaign.id}`
  const shortcuts = [
    {
      route: 'characters',
      icon: Sword,
      title: 'nav.characters',
      description: 'overview.charactersHint',
    },
    {
      route: 'chapters',
      icon: BookOpen,
      title: 'nav.chapters',
      description: 'overview.chaptersHint',
    },
    { route: 'scenes', icon: Map, title: 'nav.scenes', description: 'overview.scenesHint' },
    {
      route: 'sessions',
      icon: Calendar,
      title: 'nav.sessions',
      description: 'overview.sessionsHint',
    },
  ]
  const empty = stats && stats.chapters.total === 0 && stats.entities.total === 0
  return (
    <div className="mx-auto max-w-6xl space-y-6" data-testid="campaign-overview">
      <Breadcrumbs
        items={[{ label: t('nav.allCampaigns'), href: '/dashboard' }, { label: t('nav.overview') }]}
      />
      <section
        aria-labelledby="campaign-overview-title"
        className="relative isolate overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[linear-gradient(125deg,var(--bg-primary),var(--bg-secondary))] p-5 shadow-[var(--shadow-md)] sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 -z-10 h-80 w-80 rounded-full border border-[var(--accent)]/15"
        >
          <div className="absolute inset-10 rounded-full border border-[var(--accent)]/15" />
          <div className="absolute inset-24 rotate-45 border border-[var(--accent)]/15" />
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-subtle)] px-3 py-1.5 text-[var(--accent-text)]">
                <Compass size={14} aria-hidden="true" />
                {t('overview.workspace')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                {isDm ? (
                  <Crown size={14} aria-hidden="true" />
                ) : (
                  <Users size={14} aria-hidden="true" />
                )}
                {t(isDm ? 'role.dm' : 'role.player')}
              </span>
            </div>
            <h1
              id="campaign-overview-title"
              className="text-3xl leading-tight font-bold tracking-tight break-words text-[var(--text-primary)] sm:text-4xl"
            >
              {campaign.name}
            </h1>
            {campaign.genre && (
              <p className="mt-3 text-xs font-semibold tracking-wide break-words text-[var(--accent-text)]">
                {campaign.genre}
              </p>
            )}
            <p className="mt-4 max-w-2xl text-sm leading-6 break-words whitespace-pre-wrap text-[var(--text-secondary)]">
              {campaign.description || t('overview.description')}
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
              {t(isDm ? 'overview.readyTitle' : 'overview.partyTitle')}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {t(isDm ? 'overview.readyHint' : 'overview.partyHint')}
            </p>
            <Link
              href={`${base}/${isDm ? 'session' : 'characters'}`}
              className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent-foreground)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              {isDm ? (
                <MonitorPlay size={18} aria-hidden="true" />
              ) : (
                <Sword size={18} aria-hidden="true" />
              )}
              {t(isDm ? 'overview.startSession' : 'overview.openCharacters')}
              <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
            {isDm && activeScene && (
              <Link
                href={`${base}/scenes/${activeScene.id}`}
                className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <Map size={17} className="shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs text-[var(--text-muted)]">
                    {t('overview.activeScene')}
                  </span>
                  <span className="block truncate font-medium text-[var(--text-primary)]">
                    {activeScene.name}
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>
      <section aria-labelledby="campaign-shortcuts-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="campaign-shortcuts-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            {t('overview.shortcuts')}
          </h2>
          <span className="text-xs text-[var(--text-muted)]">{t('overview.shortcutsHint')}</span>
        </div>
        <nav
          aria-label={t('overview.shortcuts')}
          className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 2xl:grid-cols-4"
        >
          {shortcuts.map(({ route, icon: Icon, title, description }) => (
            <Link
              key={route}
              href={`${base}/${route}`}
              className="group flex min-h-24 min-w-0 items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">
                  {t(title)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
                  {t(description)}
                </span>
              </span>
              <ArrowRight
                size={16}
                className="shrink-0 text-[var(--text-subtle)] transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>
      </section>
      {stats ? (
        <>
          <CampaignStatsGrid campaignId={campaign.id} stats={stats} lang={lang} isDm={isDm} />
          {empty ? (
            <section
              className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center"
              aria-labelledby="campaign-empty-title"
            >
              <Sparkles
                size={25}
                className="mx-auto text-[var(--accent-text)]"
                aria-hidden="true"
              />
              <h2
                id="campaign-empty-title"
                className="mt-3 font-semibold text-[var(--text-primary)]"
              >
                {t('overview.emptyTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text-muted)]">
                {t(isDm ? 'overview.emptyDm' : 'overview.emptyPlayer')}
              </p>
              <Link
                href={`${base}/chapters`}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--accent-text)] hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <BookOpen size={16} aria-hidden="true" />
                {t('overview.openChapters')}
              </Link>
            </section>
          ) : (
            <EntitiesBreakdown campaignId={campaign.id} stats={stats.entities} />
          )}
          <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-2">
            <RecentActivity campaignId={campaign.id} recent={stats.recent} lang={lang} now={now} />
            {isDm && <NeedsAttention campaignId={campaign.id} stats={stats} lang={lang} />}
          </div>
        </>
      ) : (
        <section
          role="status"
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
        >
          <h2 className="font-semibold text-[var(--text-primary)]">
            {t('overview.statsUnavailable')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {t('overview.statsUnavailableHint')}
          </p>
        </section>
      )}
    </div>
  )
}
