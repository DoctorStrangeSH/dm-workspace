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

export default function SaveAsTemplateButton({
  entityId,
  campaignId,
  defaultName,
}: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [done, setDone] = useState(false)
  const [name, setName] = useState(defaultName)

  const handleSave = () => {
    startTransition(async () => {
      const res = await createTemplateFromEntity(
        entityId,
        campaignId,
        name
      )
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 hover:border-indigo-600 text-slate-300 transition"
      >
        <Sparkles size={14} />
        Сохранить как шаблон
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              Сохранить как шаблон?
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Шаблон будет доступен для создания новых сущностей этого типа.
            </p>

            <label className="block text-sm text-slate-300 mb-1">
              Название шаблона
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 mb-4"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                disabled={isPending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
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