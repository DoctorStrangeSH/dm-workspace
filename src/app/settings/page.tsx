export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvatarUploader from './avatar-uploader'
import ProfileForm from './profile-form'
import SecurityForm from './security-form'
import DeleteAccountSection from './delete-account-section'
import ThemeToggle from '@/components/theme-toggle'
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui'

export default async function SettingsPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <AppShell title="Настройки" backHref="/dashboard" actions={<ThemeToggle />} maxWidth="md">
      <div className="space-y-6">
        {/* Профиль */}
        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Профиль</h2>
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
        </Card>

        {/* Безопасность */}
        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Безопасность</h2>
          <SecurityForm currentEmail={user.email ?? ''} />
        </Card>

        {/* Опасная зона */}
        <Card padding="lg" className="border-[var(--danger)]/40 bg-[var(--danger-subtle)]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--danger-text)]">Опасная зона</h2>
          <DeleteAccountSection />
        </Card>
      </div>
    </AppShell>
  )
}
