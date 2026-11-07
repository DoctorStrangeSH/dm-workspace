'use client'

import { Users } from 'lucide-react'
import { useT } from '@/lib/i18n'

export function InvitationNotice() {
  const t = useT()
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-4">
      <Users size={20} className="shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-[var(--accent-text)]">{t('auth.invite.title')}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
          {t('auth.invite.description')}
        </p>
      </div>
    </div>
  )
}
