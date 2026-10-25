export const instant = false

import { connection } from 'next/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Crown, Users, Settings as SettingsIcon } from 'lucide-react'
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('dashboard.myCampaigns')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t('common.total')}: {asDm.length + asPlayer.length}
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
