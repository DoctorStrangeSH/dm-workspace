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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { asDm, asPlayer } = await getUserCampaigns(user.id)

  return (
    <div className="min-h-screen">
      <header
        className="border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-950/60 border border-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-300">
                {(profile?.display_name ?? user.email ?? 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">DM Workspace</h1>
              <p
                className="text-xs truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {profile?.display_name ?? user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="p-2 hover:bg-slate-800 rounded-lg transition"
              title="Настройки"
            >
              <SettingsIcon size={16} />
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Мои кампании</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Всего: {asDm.length + asPlayer.length}
            </p>
          </div>
          <CreateCampaignButton />
        </div>

        {asDm.length === 0 && asPlayer.length === 0 && (
          <div
            className="border-2 border-dashed rounded-2xl p-12 text-center"
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
            <div className="flex items-center gap-2 mb-4">
              <Crown size={20} className="text-amber-400" />
              <h3 className="text-lg font-semibold">
                Я — ГМ{' '}
                <span
                  style={{ color: 'var(--text-subtle)' }}
                  className="font-normal"
                >
                  ({asDm.length})
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {asDm.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </section>
        )}

        {asPlayer.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-indigo-400" />
              <h3 className="text-lg font-semibold">
                Я — Игрок{' '}
                <span
                  style={{ color: 'var(--text-subtle)' }}
                  className="font-normal"
                >
                  ({asPlayer.length})
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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