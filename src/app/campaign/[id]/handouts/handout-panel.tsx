'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Image as ImageIcon,
  X,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react'
import {
  createHandout,
  deleteHandout,
  showHandout,
  hideHandout,
} from '@/lib/actions/handouts'
import { useToast } from '@/components/toast/toast-provider'
import type { Handout } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  campaignId: string
  handouts: Handout[]
  onClose: () => void
}

export default function HandoutPanel({
  campaignId,
  handouts,
  onClose,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [name, setName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handleUpload = () => {
    if (!pendingFile || !name.trim()) {
      toast.error('Введите название и выберите файл')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('image', pendingFile)

    startTransition(async () => {
      const res = await createHandout(campaignId, formData)
      setIsUploading(false)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Хендаут создан')
        setName('')
        setPendingFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        router.refresh()
      }
    })
  }

  const handleShow = (handoutId: string) => {
    startTransition(async () => {
      const res = await showHandout(handoutId, campaignId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Показано игрокам')
        router.refresh()
      }
    })
  }

  const handleHide = (handoutId: string) => {
    startTransition(async () => {
      const res = await hideHandout(handoutId, campaignId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Скрыто')
        router.refresh()
      }
    })
  }

  const handleDelete = (handoutId: string, handoutName: string) => {
    if (!confirm(`Удалить «${handoutName}»?`)) return
    startTransition(async () => {
      const res = await deleteHandout(handoutId, campaignId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Хендаут удалён')
        router.refresh()
      }
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 h-screen w-full sm:w-[400px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-amber-400" />
          <h2 className="font-semibold">Хендауты</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded"
        >
          <X size={18} />
        </button>
      </div>

      {/* Загрузка */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название (письмо, карта...)"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
        />
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition',
              pendingFile
                ? 'bg-green-950/40 border border-green-900/50 text-green-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            )}
          >
            <Upload size={14} />
            {pendingFile ? pendingFile.name.slice(0, 20) : 'Выбрать файл'}
          </button>
          <button
            onClick={handleUpload}
            disabled={isPending || isUploading || !pendingFile || !name.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Загрузить'}
          </button>
        </div>
      </div>

      {/* Список */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {handouts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            Нет хендаутов
          </p>
        ) : (
          handouts.map((handout) => (
            <div
              key={handout.id}
              className={cn(
                'bg-slate-950 border rounded-lg overflow-hidden transition',
                handout.is_visible
                  ? 'border-green-800/50'
                  : 'border-slate-800'
              )}
            >
              <div className="aspect-video bg-slate-900 relative overflow-hidden">
                <img
                  src={handout.image_url}
                  alt={handout.name}
                  className="w-full h-full object-cover"
                />
                {handout.is_visible && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-600 text-white rounded text-xs">
                    Видно игрокам
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-medium truncate mb-2">
                  {handout.name}
                </div>
                <div className="flex items-center gap-1">
                  {handout.is_visible ? (
                    <button
                      onClick={() => handleHide(handout.id)}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-amber-950/40 border border-amber-900/50 text-amber-300 rounded transition disabled:opacity-50"
                    >
                      <EyeOff size={10} />
                      Скрыть
                    </button>
                  ) : (
                    <button
                      onClick={() => handleShow(handout.id)}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-950/40 border border-green-900/50 text-green-300 rounded transition disabled:opacity-50"
                    >
                      <Eye size={10} />
                      Показать
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(handout.id, handout.name)}
                    disabled={isPending}
                    className="p-1 hover:bg-red-950/40 rounded transition disabled:opacity-50"
                    title="Удалить"
                  >
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}