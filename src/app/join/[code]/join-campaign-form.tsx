'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { joinCampaign } from '@/lib/actions/campaigns'
import { authPath } from '@/lib/auth/return-path'

export function JoinCampaignForm({ code }: { code: string }) {
  const t = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'auth_required' | 'invalid_invite' | 'uncertain' | null>(null)
  const pending = useRef(false)

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await joinCampaign(code)
      if ('error' in result) {
        setError(result.code ?? 'uncertain')
        setLoading(false)
        pending.current = false
        return
      }
      router.replace(`/campaign/${result.campaignId}`)
      router.refresh()
    } catch {
      // The server may have joined successfully before its response was lost.
      setError('uncertain')
      setLoading(false)
      pending.current = false
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Users size={18} className="text-[var(--accent-text)]" aria-hidden="true" />
          {t('join.confirm.party')}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {t('join.confirm.description')}
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-4 text-left text-sm leading-6 text-[var(--danger-text)]"
        >
          <p>
            {t(
              error === 'auth_required'
                ? 'join.confirm.authError'
                : error === 'invalid_invite'
                  ? 'join.error.description'
                  : 'join.confirm.uncertain'
            )}
          </p>
          {error === 'auth_required' && (
            <Link
              className="mt-2 inline-flex min-h-11 items-center underline"
              href={authPath('login', `/join/${code}`)}
              prefetch={false}
            >
              {t('auth.login.submit')}
            </Link>
          )}
        </div>
      )}
      <form onSubmit={handleJoin} aria-label={t('join.confirm.title')}>
        <Button
          type="submit"
          loading={loading}
          className="w-full"
          icon={<ArrowRight size={18} aria-hidden="true" />}
          iconPosition="right"
        >
          {t(loading ? 'join.confirm.pending' : 'join.confirm.submit')}
        </Button>
      </form>
      <Link
        href="/dashboard"
        prefetch={false}
        className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
      >
        {t('join.confirm.dashboard')}
      </Link>
      <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">{t('join.confirm.note')}</p>
    </div>
  )
}
