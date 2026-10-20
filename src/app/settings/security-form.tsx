'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Mail } from 'lucide-react'
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
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Mail size={14} className="shrink-0 text-slate-400" />
          <span className="truncate text-sm text-slate-300">{currentEmail}</span>
        </div>
        <button
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="shrink-0 rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
        >
          Изменить
        </button>
      </div>

      {showEmailForm && (
        <form
          onSubmit={handleEmail}
          className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="Новый email"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="rounded bg-slate-800 px-3 py-1 text-xs transition hover:bg-slate-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-indigo-600 px-3 py-1 text-xs text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}

      {/* Пароль */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
        <div className="flex items-center gap-2">
          <Key size={14} className="text-slate-400" />
          <span className="text-sm text-slate-300">Пароль</span>
        </div>
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
        >
          Изменить
        </button>
      </div>

      {showPasswordForm && (
        <form
          onSubmit={handlePassword}
          className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
        >
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Новый пароль (мин. 8)"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="rounded bg-slate-800 px-3 py-1 text-xs transition hover:bg-slate-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-indigo-600 px-3 py-1 text-xs text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
