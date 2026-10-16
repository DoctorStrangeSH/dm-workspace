'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createChapter } from '@/lib/actions/chapters'

interface Props {
  campaignId: string
  onClose: () => void
}

export default function CreateChapterModal({ campaignId, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createChapter(campaignId, formData)
      if (res.error) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Новая глава</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-slate-800 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={150}
              placeholder="Глава 1: Начало пути"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg p-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50 font-medium"
            >
              {isPending ? 'Создаём...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}