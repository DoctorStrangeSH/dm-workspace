'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import DeleteAccountDialog from './delete-account-dialog'

export default function DeleteAccountSection() {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('settings.deleteAccount.description')}
          </p>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">
            {t('settings.deleteAccount.cannotUndo')}
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => setOpen(true)}
          className="whitespace-nowrap"
        >
          {t('settings.deleteAccount.button')}
        </Button>
      </div>

      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </>
  )
}
