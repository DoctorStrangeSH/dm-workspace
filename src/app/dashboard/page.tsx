export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './logout-button'
import CreateCampaignButton from './create-campaign-button'
import CampaignCard from './campaign-card'
import ThemeToggle from '@/components/theme-toggle'
import { getUserCampaigns } from '@/lib/queries/campaigns'
import { Crown, Users } from 'lucide-react'
import EmptyState from '@/components/empty-state'

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
      <header className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">DM Workspace</h1>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {profile?.display_name ?? user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
  <EmptyState
    icon="🎲"
    title="Добро пожаловать в DM Workspace"
    description="Создай свою первую кампанию как ГМ или присоединись к чужой по invite-ссылке."
    size="lg"
  />
)}

        {asDm.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={20} className="text-amber-400" />
              <h3 className="text-lg font-semibold">
                Я — ГМ{' '}
                <span style={{ color: 'var(--text-subtle)' }} className="font-normal">
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
                <span style={{ color: 'var(--text-subtle)' }} className="font-normal">
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