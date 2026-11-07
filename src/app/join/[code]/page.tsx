export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Dices, XCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import { authPath, isInviteCode } from '@/lib/auth/return-path'
import { JoinCampaignForm } from './join-campaign-form'

/** Reading or prefetching an invitation must never change campaign membership. */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  await connection()
  const lang = await getLang()
  const t = createT(getDictionary(lang))
  const { code } = await params
  if (!isInviteCode(code))
    return (
      <AppShell maxWidth="sm" className="flex items-center justify-center">
        <Card padding="lg" className="w-full text-center">
          <XCircle size={40} className="mx-auto mb-4 text-[var(--danger)]" aria-hidden="true" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('join.error.title')}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            {t('join.error.description')}
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
          >
            {t('join.confirm.dashboard')}
          </Link>
        </Card>
      </AppShell>
    )
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(authPath('login', '/join/' + code))
  return (
    <AppShell maxWidth="sm" className="flex items-center justify-center">
      <Card padding="lg" className="w-full text-center">
        <Dices size={40} className="mx-auto mb-5 text-[var(--accent-text)]" aria-hidden="true" />
        <p className="mb-3 text-xs font-semibold tracking-widest text-[var(--accent-text)] uppercase">
          {t('join.confirm.eyebrow')}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {t('join.confirm.title')}
        </h1>
        <p className="mt-3 mb-6 text-sm leading-6 text-[var(--text-muted)]">
          {t('join.confirm.ready')}
        </p>
        <JoinCampaignForm code={code} />
      </Card>
    </AppShell>
  )
}
