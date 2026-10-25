'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Mail } from 'lucide-react'
import { updateEmail, updatePassword } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'
import { Input, Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  currentEmail: string
}

export default function SecurityForm({ currentEmail }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const handlePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updatePassword(formData)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('settings.security.toast.passwordUpdated'))
        setShowPasswordForm(false)
      }
    })
  }

  const handleEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateEmail(formData)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(res.message ?? t('settings.security.toast.emailUpdated'))
        setShowEmailForm(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Email */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Mail size={14} className="shrink-0 text-[var(--text-muted)]" />
          <span className="truncate text-sm text-[var(--text-secondary)]">{currentEmail}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowEmailForm(!showEmailForm)}>
          {t('settings.security.change')}
        </Button>
      </div>

      {showEmailForm && (
        <form
          onSubmit={handleEmail}
          className="space-y-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)]/50 p-3"
        >
          <Input
            name="email"
            type="email"
            required
            placeholder={t('settings.security.newEmailPlaceholder')}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowEmailForm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      )}

      {/* Пароль */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3">
        <div className="flex items-center gap-2">
          <Key size={14} className="text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)]">{t('auth.password')}</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          {t('settings.security.change')}
        </Button>
      </div>

      {showPasswordForm && (
        <form
          onSubmit={handlePassword}
          className="space-y-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)]/50 p-3"
        >
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder={t('settings.security.newPasswordPlaceholder')}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowPasswordForm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              {isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
