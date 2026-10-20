'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { deleteAccount } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'

interface Props {
  onClose: () => void
}

export default function DeleteAccountDialog({ onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  const canDelete = password.length > 0 && confirmText.toLowerCase() === 'удалить'

  const handleDelete = () => {
    if (!canDelete) return

    startTransition(async () => {
      const res = await deleteAccount(password)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }
      toast.success('Аккаунт удалён')
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-slate-900 p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-2">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-300">Удалить аккаунт?</h3>
            <p className="mt-1 text-sm text-slate-400">
              Все кампании, персонажи, данные — будут удалены{' '}
              <strong className="text-red-300">навсегда</strong>. Восстановить нельзя.
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Твой пароль (для подтверждения)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Напиши <strong className="text-red-400">удалить</strong> для подтверждения
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="удалить"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Удаляем...
                </>
              ) : (
                'Удалить навсегда'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
