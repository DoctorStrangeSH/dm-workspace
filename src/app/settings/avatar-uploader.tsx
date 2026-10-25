'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { uploadAvatar } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'

interface Props {
  currentUrl: string | null
  displayName: string
}

export default function AvatarUploader({ currentUrl, displayName }: Props) {
  const t = useT()
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
        toast.error(res.error ?? t('common.error'))
        setPreview(currentUrl)
      } else {
        toast.success(t('settings.avatar.toast.updated'))
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--border-default)] transition hover:border-[var(--accent)]"
        disabled={isPending}
      >
        {preview ? (
          <img src={preview} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--accent-subtle)] text-2xl font-bold text-[var(--accent-text)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
          {isPending ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
        </div>
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      <div className="text-sm text-[var(--text-muted)]">
        <p className="font-medium text-[var(--text-primary)]">{t('settings.avatar.title')}</p>
        <p className="text-xs">{t('settings.avatar.hint')}</p>
      </div>
    </div>
  )
}
