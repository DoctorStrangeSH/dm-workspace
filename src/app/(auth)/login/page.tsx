'use client'

import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input, Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { authPath, inviteReturnPath, safeReturnPath } from '@/lib/auth/return-path'
import { InvitationNotice } from '@/components/auth/invitation-notice'

function LoginForm() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeReturnPath(searchParams.get('next'))
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending.current) return
    pending.current = true
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        pending.current = false
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setError(t('auth.connectionError'))
      setLoading(false)
      pending.current = false
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]/80 p-8 shadow-2xl backdrop-blur">
      <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">
        {t('auth.login.title')}
      </h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">{t('auth.login.subtitle')}</p>
      {inviteReturnPath(next) && <InvitationNotice />}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email"
        />

        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label={t('auth.password')}
        />

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-2 text-sm text-[var(--danger-text)]"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        {t('auth.login.noAccount')}{' '}
        <Link
          href={authPath('signup', next)}
          prefetch={false}
          className="text-[var(--accent-text)] hover:underline"
        >
          {t('auth.login.signupLink')}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  const t = useT()

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]/80 p-8 text-center shadow-2xl backdrop-blur">
          <p className="text-[var(--text-muted)]">{t('common.loading')}</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
