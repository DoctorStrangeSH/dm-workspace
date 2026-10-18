'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createCampaign } from '@/lib/actions/campaigns'
import { GENRES } from '@/lib/types'

interface Props {
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateCampaignModal({ onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createCampaign(formData)
      if ('error' in res) {
        setError(res.error ?? 'Ошибка')
        return
      }
      onSuccess?.()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Новая кампания</h2>
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
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="Проклятие Страда"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Жанр</label>
            <select
              name="genre"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              defaultValue=""
            >
              <option value="">— Не выбран —</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Описание
            </label>
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              placeholder="Краткое описание кампании..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
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