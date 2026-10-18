'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { addSpell } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import {
  SPELL_SCHOOLS,
  type SpellSchool,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  characterId: string
  campaignId: string
  onClose: () => void
}

export default function AddSpellDialog({
  characterId,
  campaignId,
  onClose,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [level, setLevel] = useState(0)
  const [school, setSchool] = useState<SpellSchool | ''>('')
  const [castingTime, setCastingTime] = useState('')
  const [range, setRange] = useState('')
  const [components, setComponents] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [ritual, setRitual] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Введите название')
      return
    }

    startTransition(async () => {
      const res = await addSpell(characterId, campaignId, {
        name: name.trim(),
        level,
        school: school || undefined,
        castingTime: castingTime || undefined,
        range: range || undefined,
        components: components || undefined,
        duration: duration || undefined,
        description: description || undefined,
        ritual,
      })

      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }

      toast.success('Заклинание добавлено')
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col my-auto">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="font-semibold">Новое заклинание</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-slate-800 rounded transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Огненный шар"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Уровень
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={0}>Заговор (0)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                  <option key={l} value={l}>
                    {l} уровень
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Школа</label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value as SpellSchool)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Не выбрано —</option>
                {Object.entries(SPELL_SCHOOLS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Время
              </label>
              <input
                type="text"
                value={castingTime}
                onChange={(e) => setCastingTime(e.target.value)}
                placeholder="1 действие"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Дистанция
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="150 футов"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Компоненты
              </label>
              <input
                type="text"
                value={components}
                onChange={(e) => setComponents(e.target.value)}
                placeholder="V, S, M"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Длительность
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Мгновенно"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ritual"
              checked={ritual}
              onChange={(e) => setRitual(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="ritual" className="text-sm text-slate-300">
              Можно использовать как ритуал
            </label>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Описание заклинания..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

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
              {isPending ? 'Добавляем...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}