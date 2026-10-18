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

  const canDelete =
    password.length > 0 && confirmText.toLowerCase() === 'удалить'

  const handleDelete = () => {
    if (!canDelete) return

    startTransition(async () => {
      const res = await deleteAccount(password)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Аккаунт удалён')
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-950/40 border border-red-900/50 rounded-lg">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-300">
              Удалить аккаунт?
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Все кампании, персонажи, данные — будут удалены{' '}
              <strong className="text-red-300">навсегда</strong>. Восстановить
              нельзя.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Твой пароль (для подтверждения)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Напиши <strong className="text-red-400">удалить</strong> для
              подтверждения
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="удалить"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition disabled:opacity-50"
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