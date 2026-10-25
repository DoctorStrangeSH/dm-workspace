export const instant = false

import { connection } from 'next/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Crown, Users, Settings as SettingsIcon, Sparkles, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserCampaigns } from '@/lib/queries/campaigns'
import { AppShell } from '@/components/app-shell'
import { IconButton, EmptyState } from '@/components/ui'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import LogoutButton from './logout-button'
import CreateCampaignButton from './create-campaign-button'
import CampaignCard from './campaign-card'
import ThemeToggle from '@/components/theme-toggle'

export default async function DashboardPage() {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { asDm, asPlayer } = await getUserCampaigns(user.id)

  const leading = profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt=""
      className="h-8 w-8 rounded-full border border-[var(--border-default)] object-cover"
    />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-sm font-bold text-[var(--accent-text)]">
      {(profile?.display_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
    </div>
  )

  const actions = (
    <>
      <Link href="/settings" aria-label={t('nav.settings')}>
        <IconButton variant="ghost" size="sm" label={t('nav.settings')}>
          <SettingsIcon size={16} />
        </IconButton>
      </Link>
      <ThemeToggle />
      <LogoutButton />
    </>
  )

  return (
    <AppShell
      title="DM Workspace"
      subtitle={profile?.display_name ?? user.email ?? undefined}
      leading={leading}
      actions={actions}
      maxWidth="xl"
    >
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(120deg,var(--bg-primary),var(--bg-secondary))] p-5 shadow-[var(--shadow-lg)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-[var(--accent)]/15 sm:-right-4 sm:-top-20 sm:h-72 sm:w-72">
          <div className="absolute inset-7 rounded-full border border-[var(--accent)]/10" />
          <div className="absolute inset-14 rounded-full border border-[var(--accent)]/10" />
          <Sparkles className="absolute right-16 top-16 h-8 w-8 text-[var(--accent)]/35" />
        </div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-subtle)] px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--accent-text)]">
              <Sparkles size={14} aria-hidden="true" />
              {t('dashboard.workspaceLabel')}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {t('dashboard.welcomeTitle')}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text-muted)] sm:text-base">
              {t('dashboard.welcomeDescription')}
            </p>
          </div>
          <div className="relative flex shrink-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-subtle)] text-[var(--accent-text)]">
              <BookOpen size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">{t('common.total')}</p>
              <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{asDm.length + asPlayer.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-text)]">
            {t('dashboard.campaignsEyebrow')}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {t('dashboard.myCampaigns')}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t('dashboard.campaignCount', { count: asDm.length + asPlayer.length })}
          </p>
        </div>
        <CreateCampaignButton />
      </div>

      {asDm.length === 0 && asPlayer.length === 0 && (
        <EmptyState
          icon="🎲"
          title={t('dashboard.empty.title')}
          description={t('dashboard.empty.description')}
          size="lg"
        />
      )}

      {asDm.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Crown size={20} className="text-[var(--warning)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('dashboard.asDm')}{' '}
              <span className="font-normal text-[var(--text-subtle)]">({asDm.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {asDm.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {asPlayer.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users size={20} className="text-[var(--info)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('dashboard.asPlayer')}{' '}
              <span className="font-normal text-[var(--text-subtle)]">({asPlayer.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {asPlayer.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  )
}
