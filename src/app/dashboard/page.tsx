export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './logout-button'
import CreateCampaignButton from './create-campaign-button'
import CampaignCard from './campaign-card'
import { getUserCampaigns } from '@/lib/queries/campaigns'
import { Crown, Users } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">DM Workspace</h1>
            <p className="text-slate-400 text-xs">
              {profile?.display_name ?? user.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Мои кампании</h2>
            <p className="text-slate-400 text-sm mt-1">
              Всего: {asDm.length + asPlayer.length}
            </p>
          </div>
          <CreateCampaignButton />
        </div>

        {asDm.length === 0 && asPlayer.length === 0 && (
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 mb-4">
              Пока нет ни одной кампании.
            </p>
            <p className="text-slate-500 text-sm">
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
                <span className="text-slate-500 font-normal">
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
                <span className="text-slate-500 font-normal">
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