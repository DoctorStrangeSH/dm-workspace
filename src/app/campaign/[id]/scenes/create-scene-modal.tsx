'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createScene } from '@/lib/actions/scenes'
import { useToast } from '@/components/toast/toast-provider'

interface Props {
  campaignId: string
  onClose: () => void
}

export default function CreateSceneModal({ campaignId, onClose }: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [gridType, setGridType] = useState<'square' | 'hex' | 'none'>('square')
  const [gridSize, setGridSize] = useState(50)
  const [width, setWidth] = useState(30)
  const [height, setHeight] = useState(20)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Введите название')
      return
    }

    startTransition(async () => {
      const res = await createScene(campaignId, {
        name: name.trim(),
        grid_type: gridType,
        grid_size: gridSize,
        width,
        height,
      })
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }
      toast.success('Сцена создана')
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="font-semibold">Новая сцена</h2>
          <button onClick={onClose} disabled={isPending} className="rounded p-1 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Подземелье гоблинов"
              autoFocus
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Тип сетки</label>
              <select
                value={gridType}
                onChange={(e) => setGridType(e.target.value as unknown)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="square">Квадрат</option>
                <option value="hex">Гекс</option>
                <option value="none">Без сетки</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Размер клетки (px)</label>
              <input
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value) || 50)}
                min={20}
                max={150}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Ширина (клеток)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value) || 30)}
                min={5}
                max={100}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Высота (клеток)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 20)}
                min={5}
                max={100}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
          </div>

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
