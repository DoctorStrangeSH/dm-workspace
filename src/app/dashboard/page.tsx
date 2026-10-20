export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import CreateCampaignButton from './create-campaign-button'
import CampaignCard from './campaign-card'
import ThemeToggle from '@/components/theme-toggle'
import { getUserCampaigns } from '@/lib/queries/campaigns'
import { Crown, Users, Settings as SettingsIcon } from 'lucide-react'

export default async function DashboardPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { asDm, asPlayer } = await getUserCampaigns(user.id)

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-900/50 bg-indigo-950/60 text-sm font-bold text-indigo-300">
                {(profile?.display_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold sm:text-xl">DM Workspace</h1>
              <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                {profile?.display_name ?? user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="rounded-lg p-2 transition hover:bg-slate-800"
              title="Настройки"
            >
              <SettingsIcon size={16} />
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Мои кампании</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Всего: {asDm.length + asPlayer.length}
            </p>
          </div>
          <CreateCampaignButton />
        </div>

        {asDm.length === 0 && asPlayer.length === 0 && (
          <div
            className="rounded-2xl border-2 border-dashed p-12 text-center"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              Пока нет ни одной кампании.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Создай первую — как ГМ или присоединись по invite-ссылке.
            </p>
          </div>
        )}

        {asDm.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Crown size={20} className="text-amber-400" />
              <h3 className="text-lg font-semibold">
                Я — ГМ{' '}
                <span style={{ color: 'var(--text-subtle)' }} className="font-normal">
                  ({asDm.length})
                </span>
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
              <Users size={20} className="text-indigo-400" />
              <h3 className="text-lg font-semibold">
                Я — Игрок{' '}
                <span style={{ color: 'var(--text-subtle)' }} className="font-normal">
                  ({asPlayer.length})
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {asPlayer.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
