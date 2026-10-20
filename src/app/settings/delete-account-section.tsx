'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import DeleteAccountDialog from './delete-account-dialog'

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">Удалить аккаунт и все данные навсегда.</p>
          <p className="mt-1 text-xs text-slate-500">Это действие нельзя отменить.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-1.5 text-sm whitespace-nowrap text-red-300 transition hover:bg-red-950/60"
        >
          <Trash2 size={14} />
          Удалить аккаунт
        </button>
      </div>

      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </>
  )
}
