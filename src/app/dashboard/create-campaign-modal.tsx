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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Новая кампания</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1 transition hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
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
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Жанр</label>
            <select
              name="genre"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
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
            <label className="mb-1 block text-sm text-slate-300">Описание</label>
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              placeholder="Краткое описание кампании..."
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? 'Создаём...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
