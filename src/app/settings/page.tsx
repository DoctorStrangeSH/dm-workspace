export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AvatarUploader from './avatar-uploader'
import ProfileForm from './profile-form'
import SecurityForm from './security-form'
import DeleteAccountSection from './delete-account-section'
import ThemeToggle from '@/components/theme-toggle'

export default async function SettingsPage() {
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

  return (
    <div className="min-h-screen">
      <header
        className="border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-800 rounded-lg transition"
            title="Назад"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold flex-1">Настройки</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Профиль */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Профиль</h2>
          <div className="space-y-6">
            <AvatarUploader
              currentUrl={profile?.avatar_url ?? null}
              displayName={profile?.display_name ?? user.email ?? 'U'}
            />
            <ProfileForm
              currentDisplayName={profile?.display_name ?? ''}
              currentUsername={profile?.username ?? ''}
            />
          </div>
        </section>

        {/* Безопасность */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Безопасность</h2>
          <SecurityForm currentEmail={user.email ?? ''} />
        </section>

        {/* Опасная зона */}
        <section className="bg-red-950/20 border border-red-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-300 mb-4">
            Опасная зона
          </h2>
          <DeleteAccountSection />
        </section>
      </main>
    </div>
  )
}