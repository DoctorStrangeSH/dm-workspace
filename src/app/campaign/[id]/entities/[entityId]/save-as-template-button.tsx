'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Check } from 'lucide-react'
import { createTemplateFromEntity } from '@/lib/actions/templates'
import { useToast } from '@/components/toast/toast-provider'

interface Props {
  entityId: string
  campaignId: string
  defaultName: string
}

export default function SaveAsTemplateButton({ entityId, campaignId, defaultName }: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [done, setDone] = useState(false)
  const [name, setName] = useState(defaultName)

  const handleSave = () => {
    startTransition(async () => {
      const res = await createTemplateFromEntity(entityId, campaignId, name)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }
      toast.success('Шаблон сохранён')
      setDone(true)
      setTimeout(() => {
        setDone(false)
        setShowDialog(false)
      }, 1500)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:border-indigo-600"
      >
        <Sparkles size={14} />
        Сохранить как шаблон
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-2 text-lg font-semibold">Сохранить как шаблон?</h3>
            <p className="mb-4 text-sm text-slate-400">
              Шаблон будет доступен для создания новых сущностей этого типа.
            </p>

            <label className="mb-1 block text-sm text-slate-300">Название шаблона</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mb-4 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDialog(false)}
                disabled={isPending}
                className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !name.trim()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {done ? (
                  <>
                    <Check size={14} />
                    Сохранено
                  </>
                ) : isPending ? (
                  'Сохраняем...'
                ) : (
                  'Сохранить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
