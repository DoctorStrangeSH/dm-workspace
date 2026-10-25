'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { deleteAccount } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Input } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  onClose: () => void
}

export default function DeleteAccountDialog({ onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  const confirmWord = t('settings.deleteAccount.confirmWord')
  const canDelete = password.length > 0 && confirmText.toLowerCase() === confirmWord.toLowerCase()

  const handleDelete = () => {
    if (!canDelete) return

    startTransition(async () => {
      const res = await deleteAccount(password)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(t('settings.deleteAccount.toast.deleted'))
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={t('settings.deleteAccount.dialogTitle')}
      description={t('settings.deleteAccount.dialogDescription')}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
            loading={isPending}
          >
            {isPending
              ? t('settings.deleteAccount.deleting')
              : t('settings.deleteAccount.deleteForever')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-subtle)] p-3">
          <AlertTriangle size={20} className="shrink-0 text-[var(--danger-text)]" />
          <p className="text-sm text-[var(--danger-text)]">{t('settings.deleteAccount.warning')}</p>
        </div>

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          label={t('settings.deleteAccount.passwordLabel')}
        />

        <Input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={confirmWord}
          label={t('settings.deleteAccount.confirmLabel', { word: confirmWord })}
        />
      </div>
    </Dialog>
  )
}
