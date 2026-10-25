export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button, Card } from '@/components/ui'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

  const { code } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${code}`)
  }

  const { data: campaignId, error } = await supabase.rpc('join_campaign_by_code', { code })

  // ─── Ошибка ───
  if (error || !campaignId) {
    return (
      <AppShell maxWidth="sm" className="flex items-center justify-center">
        <Card padding="lg" className="w-full text-center">
          <XCircle size={48} className="mx-auto mb-4 text-[var(--danger)]" />
          <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
            {t('join.error.title')}
          </h1>
          <p className="mb-6 text-sm text-[var(--text-muted)]">{t('join.error.description')}</p>
          <Link href="/dashboard">
            <Button variant="primary" size="md">
              {t('join.error.goHome')}
            </Button>
          </Link>
        </Card>
      </AppShell>
    )
  }

  // ─── Успех ───
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', campaignId)
    .single()

  return (
    <AppShell maxWidth="sm" className="flex items-center justify-center">
      <Card padding="lg" className="w-full text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-[var(--success)]" />
        <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
          {t('join.success.title')}
        </h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          {t('join.success.description', {
            name: campaign?.name ?? t('join.success.untitled'),
          })}
        </p>
        <Link href="/dashboard">
          <Button variant="primary" size="md">
            {t('join.success.goToCampaigns')}
          </Button>
        </Link>
      </Card>
    </AppShell>
  )
}
