'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { updateProfile } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'

interface Props {
  currentDisplayName: string
  currentUsername: string
}

export default function ProfileForm({
  currentDisplayName,
  currentUsername,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [username, setUsername] = useState(currentUsername)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateProfile(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Профиль обновлён')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          Имя для отображения
        </label>
        <input
          name="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Username</label>
        <input
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          Буквы, цифры и подчёркивания
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Сохраняем...
          </>
        ) : (
          <>
            <Save size={14} />
            Сохранить
          </>
        )}
      </button>
    </form>
  )
}