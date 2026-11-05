'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, ImagePlus, Check } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { uploadMap } from '@/lib/actions/scenes'
import { mapFileError } from '@/lib/maps/geometry'
import type { Scene } from '@/lib/types'

export default function MapUploadDialog({
  scene,
  campaignId,
  onClose,
  onUploaded,
}: {
  scene: Scene
  campaignId: string
  onClose: () => void
  onUploaded: () => void
}) {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  const busy = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const currentPreview = useRef('')
  useEffect(
    () => () => {
      if (currentPreview.current) URL.revokeObjectURL(currentPreview.current)
    },
    []
  )
  const choose = (files: FileList | null) => {
    if (busy.current || uncertain) return
    setDimensions(null)
    setFile(null)
    if (currentPreview.current) URL.revokeObjectURL(currentPreview.current)
    currentPreview.current = ''
    setPreview('')
    if (!files?.length) return
    if (files.length !== 1) {
      setError(t('map.file.one'))
      return
    }
    const next = files[0]
    const issue = mapFileError(next)
    setError(issue ? t('map.file.' + issue) : '')
    if (!issue) {
      const url = URL.createObjectURL(next)
      currentPreview.current = url
      setPreview(url)
      setFile(next)
    }
  }
  const submit = async () => {
    if (!file || !dimensions || busy.current || uncertain) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const result = await uploadMap(scene.id, campaignId, file)
      if ('error' in result) {
        setError(result.error ?? t('common.error'))
        return
      }
      onUploaded()
      onClose()
    } catch {
      setError(t('map.uncertain'))
      setUncertain(true)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <Dialog
      open
      onClose={() => {
        if (!busy.current) onClose()
      }}
      title={scene.image_url ? t('scenes.map.replace') : t('scenes.map.upload')}
      description={t('map.uploadIntro')}
      closeLabel={t('common.close')}
      closeDisabled={pending}
      size="lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            icon={<Check size={16} />}
            loading={pending}
            disabled={!file || !dimensions || uncertain}
            onClick={submit}
          >
            {scene.image_url ? t('map.confirmReplace') : t('map.confirmUpload')}
          </Button>
        </div>
      }
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={t('map.chooseFile')}
        className="sr-only"
        tabIndex={-1}
        disabled={pending || uncertain}
        onChange={(e) => {
          choose(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={pending || uncertain}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          choose(e.dataTransfer.files)
        }}
        className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--accent)]/50 bg-[var(--accent-subtle)] p-5 text-center disabled:opacity-50"
      >
        <ImagePlus size={28} className="text-[var(--accent-text)]" />
        <span className="font-semibold text-[var(--text-primary)]">{t('map.chooseFile')}</span>
        <span className="text-sm text-[var(--text-secondary)]">{t('map.fileHint')}</span>
      </button>
      {file && preview && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-[var(--text-secondary)]">
            <span className="min-w-0 [overflow-wrap:anywhere]">{file.name}</span>
            <span>
              {(file.size / 1024 / 1024).toFixed(1)} MB
              {dimensions ? ' · ' + dimensions.width + ' × ' + dimensions.height + ' px' : ''}
            </span>
          </div>
          <div
            className="relative max-h-80 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)]"
            style={{ aspectRatio: scene.width / scene.height }}
          >
            <Image
              key={preview}
              src={preview}
              alt={t('map.preview')}
              fill
              unoptimized
              className="object-contain"
              sizes="640px"
              onLoad={(e) => {
                if (currentPreview.current === preview)
                  setDimensions({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                  })
              }}
              onError={() => {
                if (currentPreview.current !== preview) return
                setDimensions(null)
                setError(t('map.file.decode'))
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                backgroundSize: 100 / scene.width + '% ' + 100 / scene.height + '%',
              }}
            />
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-2 rounded-xl bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-secondary)]">
        <Upload size={18} className="shrink-0 text-[var(--accent-text)]" />
        <p>{t('map.geometryKept', { width: scene.width, height: scene.height })}</p>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--danger-text)]">
          {error}
        </p>
      )}
    </Dialog>
  )
}
