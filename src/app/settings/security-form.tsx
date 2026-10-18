'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Mail, Loader2 } from 'lucide-react'
import { updateEmail, updatePassword } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'

interface Props {
  currentEmail: string
}

export default function SecurityForm({ currentEmail }: Props) {
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
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Пароль обновлён')
        setShowPasswordForm(false)
      }
    })
  }

  const handleEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateEmail(formData)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success(res.message ?? 'Email обновлён')
        setShowEmailForm(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Email */}
      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2 min-w-0">
          <Mail size={14} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-300 truncate">
            {currentEmail}
          </span>
        </div>
        <button
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition shrink-0"
        >
          Изменить
        </button>
      </div>

      {showEmailForm && (
        <form onSubmit={handleEmail} className="space-y-2 p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
          <input
            name="email"
            type="email"
            required
            placeholder="Новый email"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
            >
              {isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}

      {/* Пароль */}
      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Key size={14} className="text-slate-400" />
          <span className="text-sm text-slate-300">Пароль</span>
        </div>
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
        >
          Изменить
        </button>
      </div>

      {showPasswordForm && (
        <form onSubmit={handlePassword} className="space-y-2 p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Новый пароль (мин. 8)"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
            >
              {isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}