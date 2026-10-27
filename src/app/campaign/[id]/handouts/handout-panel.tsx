'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, X, Eye, EyeOff, Trash2, Upload } from 'lucide-react'
import { createHandout, deleteHandout, showHandout, hideHandout } from '@/lib/actions/handouts'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, IconButton } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Handout } from '@/lib/types'

interface Props {
  campaignId: string
  handouts: Handout[]
  onClose: () => void
}

export default function HandoutPanel({ campaignId, handouts, onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [name, setName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const handleUpload = () => {
    if (!pendingFile || !name.trim()) {
      toast.error(t('handouts.form.error'))
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('image', pendingFile)

    startTransition(async () => {
      const res = await createHandout(campaignId, formData)
      setIsUploading(false)

      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('handouts.toast.created'))
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
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('handouts.toast.shown'))
        router.refresh()
      }
    })
  }

  const handleHide = (handoutId: string) => {
    startTransition(async () => {
      const res = await hideHandout(handoutId, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('handouts.toast.hidden'))
        router.refresh()
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteHandout(deleteTarget.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('handouts.toast.deleted'))
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl sm:w-[400px]">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-[var(--warning)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">{t('handouts.title')}</h2>
        </div>
        <IconButton variant="ghost" size="sm" label={t('common.close')} onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>

      <div className="space-y-2 border-b border-[var(--border-default)] p-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('handouts.namePlaceholder')}
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none"
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
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition',
              pendingFile
                ? 'border border-[var(--success)]/40 bg-[var(--success-subtle)] text-[var(--success-text)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            )}
          >
            <Upload size={14} />
            {pendingFile ? pendingFile.name.slice(0, 20) : t('handouts.chooseFile')}
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={isPending || isUploading || !pendingFile || !name.trim()}
            loading={isUploading}
          >
            {t('handouts.upload')}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {handouts.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">{t('handouts.empty')}</p>
        ) : (
          handouts.map((handout) => (
            <div
              key={handout.id}
              className={cn(
                'overflow-hidden rounded-lg border bg-[var(--bg-app)] transition',
                handout.is_visible ? 'border-[var(--success)]/40' : 'border-[var(--border-default)]'
              )}
            >
              <div className="relative aspect-video overflow-hidden bg-[var(--bg-secondary)]">
                <img
                  src={'/api/handouts/' + handout.id + '/image'}
                  alt={handout.name}
                  className="h-full w-full object-cover"
                />
                {handout.is_visible && (
                  <div className="absolute top-2 right-2 rounded bg-[var(--success)] px-2 py-0.5 text-xs text-white">
                    {t('handouts.visibleToPlayers')}
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="mb-2 truncate text-sm font-medium text-[var(--text-primary)]">
                  {handout.name}
                </div>
                <div className="flex items-center gap-1">
                  {handout.is_visible ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<EyeOff size={10} />}
                      onClick={() => handleHide(handout.id)}
                      disabled={isPending}
                      className="flex-1 text-[var(--warning-text)]"
                    >
                      {t('handouts.hide')}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye size={10} />}
                      onClick={() => handleShow(handout.id)}
                      disabled={isPending}
                      className="flex-1 text-[var(--success-text)]"
                    >
                      {t('handouts.show')}
                    </Button>
                  )}
                  <IconButton
                    variant="ghost"
                    size="sm"
                    label={t('common.delete')}
                    onClick={() => setDeleteTarget({ id: handout.id, name: handout.name })}
                    disabled={isPending}
                  >
                    <Trash2 size={10} className="text-[var(--danger)]" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !isPending && setDeleteTarget(null)}
        title={t('handouts.deleteConfirm.title')}
        description={
          deleteTarget ? t('handouts.deleteConfirm.description', { name: deleteTarget.name }) : ''
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('handouts.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </aside>
  )
}
