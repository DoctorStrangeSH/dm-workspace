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

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link
            href="/dashboard"
            className="rounded-lg p-2 transition hover:bg-slate-800"
            title="Назад"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="flex-1 text-xl font-bold">Настройки</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Профиль */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Профиль</h2>
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
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Безопасность</h2>
          <SecurityForm currentEmail={user.email ?? ''} />
        </section>

        {/* Опасная зона */}
        <section className="rounded-xl border border-red-900/40 bg-red-950/20 p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-300">Опасная зона</h2>
          <DeleteAccountSection />
        </section>
      </main>
    </div>
  )
}
