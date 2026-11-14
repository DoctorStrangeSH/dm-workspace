'use client'

import { useEffect, useId, useState } from 'react'
import Image from 'next/image'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { uploadTokenArt } from '@/lib/actions/token-art'
import { TOKEN_ART_LIMIT, tokenArtSrc } from '@/lib/maps/token-art'
import type { Token } from '@/lib/types'

export default function TokenAppearance({
  token,
  canEdit,
  onUpdate,
}: {
  token: Token
  canEdit: boolean
  onUpdate: () => void
}) {
  const { lang } = useI18n()
  const ru = lang === 'ru'
  const id = useId()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [savedImage, setSavedImage] = useState(token.image_url)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])
  const src = file ? preview : tokenArtSrc({ ...token, image_url: savedImage })
  const save = async () => {
    if (!file || busy) return
    setBusy(true)
    setMessage('')
    try {
      const result = await uploadTokenArt(token.id, token.scene_id, savedImage, file)
      if ('error' in result) {
        setError(true)
        setMessage(result.error ?? (ru ? 'Не удалось сохранить' : 'Could not save'))
      } else {
        setSavedImage(result.imageUrl)
        setFile(null)
        setPreview(null)
        setError(false)
        setMessage(ru ? 'Изображение сохранено' : 'Image saved')
        onUpdate()
      }
    } catch {
      setError(true)
      setMessage(
        ru
          ? 'Не удалось подтвердить сохранение. Обновите панель'
          : 'Could not confirm the save. Reopen the panel'
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      aria-label={ru ? 'Внешний вид токена' : 'Token appearance'}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ImagePlus size={16} />
        {ru ? 'Внешний вид токена' : 'Token appearance'}
      </div>
      <div className="flex items-start gap-4">
        <div
          className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-app)]"
          style={{
            backgroundImage:
              'conic-gradient(#8882 25%, transparent 0 50%, #8882 0 75%, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        >
          {src ? (
            <Image
              src={src}
              alt={ru ? 'Предпросмотр токена' : 'Token preview'}
              fill
              unoptimized
              className="object-contain p-1"
              onError={() => {
                if (file) {
                  setError(true)
                  setMessage(ru ? 'Не удалось прочитать изображение' : 'Cannot read image')
                  setFile(null)
                  setPreview(null)
                }
              }}
            />
          ) : (
            <ImagePlus size={28} className="text-[var(--text-muted)]" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-xs text-[var(--text-muted)]">
          <p>
            {ru
              ? 'PNG с прозрачным фоном сохранит силуэт. Также можно JPG и WebP до 2 МБ.'
              : 'Transparent PNG keeps its silhouette. JPG and WebP up to 2 MB also work.'}
          </p>
          {canEdit && (
            <>
              <label htmlFor={id} className="block font-medium text-[var(--text-primary)]">
                {ru ? 'Выбрать изображение' : 'Choose image'}
              </label>
              <input
                id={id}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                className="block w-full min-w-0 text-xs file:mr-2 file:min-h-11 file:rounded-lg file:border-0 file:bg-[var(--accent-subtle)] file:px-3 file:text-[var(--accent-text)]"
                onChange={(event) => {
                  const selected = event.target.files?.[0]
                  event.target.value = ''
                  if (!selected) return
                  setFile(null)
                  setPreview(null)
                  setMessage('')
                  if (
                    !['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) ||
                    !selected.size ||
                    selected.size > TOKEN_ART_LIMIT
                  ) {
                    setError(true)
                    setMessage(
                      ru
                        ? 'Выберите PNG, JPG или WebP до 2 МБ'
                        : 'Choose PNG, JPG or WebP up to 2 MB'
                    )
                    return
                  }
                  setError(false)
                  setFile(selected)
                  setPreview(URL.createObjectURL(selected))
                }}
              />
              {file && <p className="truncate">{file.name}</p>}
            </>
          )}
        </div>
      </div>
      {file && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy || !preview} onClick={save}>
            {busy ? (ru ? 'Сохранение…' : 'Saving…') : ru ? 'Сохранить изображение' : 'Save image'}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setFile(null)
              setPreview(null)
              setMessage('')
            }}
          >
            {ru ? 'Отмена' : 'Cancel'}
          </Button>
        </div>
      )}
      {message && (
        <p role={error ? 'alert' : 'status'} className="mt-3 text-xs">
          {message}
        </p>
      )}
    </section>
  )
}
