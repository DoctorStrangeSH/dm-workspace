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
          <p className="text-sm text-slate-300">
            Удалить аккаунт и все данные навсегда.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Это действие нельзя отменить.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-950/40 border border-red-900/50 text-red-300 hover:bg-red-950/60 rounded-lg transition whitespace-nowrap"
        >
          <Trash2 size={14} />
          Удалить аккаунт
        </button>
      </div>

      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </>
  )
}