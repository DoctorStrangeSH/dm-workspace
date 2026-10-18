'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { uploadAvatar } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'

interface Props {
  currentUrl: string | null
  displayName: string
}

export default function AvatarUploader({ currentUrl, displayName }: Props) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    const formData = new FormData()
    formData.append('avatar', file)

    startTransition(async () => {
      const res = await uploadAvatar(formData)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setPreview(currentUrl)
      } else {
        toast.success('Аватар обновлён')
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 hover:border-indigo-500 transition group"
        disabled={isPending}
      >
        {preview ? (
          <img
            src={preview}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-950/60 flex items-center justify-center text-2xl font-bold text-indigo-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          {isPending ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <div className="text-sm text-slate-400">
        <p className="font-medium text-slate-200">Аватар</p>
        <p className="text-xs">PNG, JPG, WebP. Макс 2 MB.</p>
      </div>
    </div>
  )
}