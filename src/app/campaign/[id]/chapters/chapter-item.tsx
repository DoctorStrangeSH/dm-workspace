'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, Trash2, Pencil, Check, X, FileText, GripVertical, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import { IconButton, Dialog, Button, Checkbox } from '@/components/ui'
import type { Chapter } from '@/lib/types'
import {
  deleteChapter,
  updateChapterTitle,
  toggleChapterVisibility,
  duplicateChapter,
} from '@/lib/actions/chapters'
import HighlightedText from './highlighted-text'

interface Props {
  chapter: Chapter
  campaignId: string
  isDm: boolean
  searchQuery?: string
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export default function ChapterItem({
  chapter,
  campaignId,
  isDm,
  searchQuery = '',
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(chapter.title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
    disabled: !isDm || isSelectionMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const handleSaveTitle = () => {
    if (title.trim() === chapter.title) {
      setIsEditing(false)
      return
    }
    startTransition(async () => {
      const res = await updateChapterTitle(chapter.id, campaignId, title)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        setTitle(chapter.title)
      } else {
        toast.success(t('chapters.toast.renamed'))
        setIsEditing(false)
      }
    })
  }

  const handleCancelEdit = () => {
    setTitle(chapter.title)
    setIsEditing(false)
  }

  const handleToggleVisibility = () => {
    const willBeVisible = !chapter.is_visible_to_players
    startTransition(async () => {
      const res = await toggleChapterVisibility(chapter.id, campaignId, willBeVisible)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(willBeVisible ? t('chapters.toast.visible') : t('chapters.toast.hidden'))
      }
    })
  }

  const handleDuplicate = () => {
    startTransition(async () => {
      const res = await duplicateChapter(chapter.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('chapters.toast.duplicated'))
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteChapter(chapter.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('chapters.toast.deletedOne'))
        setShowDeleteConfirm(false)
      }
    })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group rounded-2xl border bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] transition-all duration-150',
          isSelected
            ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
            : 'border-[var(--border-default)] hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-md)]',
          isDragging && 'border-[var(--accent)] shadow-[var(--shadow-xl)]'
        )}
      >
        <div className="flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4">
          {isSelectionMode && (
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelect?.(chapter.id)}
              className="shrink-0"
            />
          )}

          {isDm && !isSelectionMode && (
            <div
              {...attributes}
              {...listeners}
              className="shrink-0 cursor-grab touch-none text-[var(--text-subtle)] hover:text-[var(--text-muted)] active:cursor-grabbing"
              title={t('chapters.dragHint')}
            >
              <GripVertical size={18} />
            </div>
          )}

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-text)]"><FileText size={18} aria-hidden="true" /></span>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  disabled={isPending}
                  className="min-w-0 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('common.save')}
                  onClick={handleSaveTitle}
                  disabled={isPending}
                  className="text-[var(--success)]"
                >
                  <Check size={14} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('common.cancel')}
                  onClick={handleCancelEdit}
                  disabled={isPending}
                >
                  <X size={14} />
                </IconButton>
              </div>
            ) : isSelectionMode ? (
              <button
                onClick={() => onToggleSelect?.(chapter.id)}
                className="block w-full text-left"
              >
                <h3 className="break-words font-semibold text-[var(--text-primary)]">
                  <HighlightedText text={chapter.title} query={searchQuery} />
                </h3>
                {!chapter.is_visible_to_players && isDm && (
                  <span className="text-xs text-[var(--warning-text)]/80">
                    {t('chapters.hiddenFromPlayers')}
                  </span>
                )}
              </button>
            ) : (
              <Link href={`/campaign/${campaignId}/chapters/${chapter.id}`} className="block">
                <h3 className="break-words font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-text)]">
                  <HighlightedText text={chapter.title} query={searchQuery} />
                </h3>
                {!chapter.is_visible_to_players && isDm && (
                  <span className="text-xs text-[var(--warning-text)]/80">
                    {t('chapters.hiddenFromPlayers')}
                  </span>
                )}
              </Link>
            )}
          </div>

          {isDm && !isEditing && !isSelectionMode && (
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 opacity-100 transition md:opacity-60 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <IconButton
                variant="ghost"
                size="sm"
                label={chapter.is_visible_to_players ? t('chapters.hide') : t('chapters.show')}
                onClick={handleToggleVisibility}
                disabled={isPending}
              >
                {chapter.is_visible_to_players ? (
                  <Eye size={16} className="text-[var(--success)]" />
                ) : (
                  <EyeOff size={16} className="text-[var(--text-subtle)]" />
                )}
              </IconButton>

              <IconButton
                variant="ghost"
                size="sm"
                label={t('chapters.rename')}
                onClick={() => setIsEditing(true)}
                disabled={isPending}
              >
                <Pencil size={16} />
              </IconButton>

              <IconButton
                variant="ghost"
                size="sm"
                label={t('chapters.duplicate')}
                onClick={handleDuplicate}
                disabled={isPending}
              >
                <Copy size={16} />
              </IconButton>

              <IconButton
                variant="ghost"
                size="sm"
                label={t('common.delete')}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="text-[var(--danger)]"
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('chapters.deleteOne.title')}
        description={t('chapters.deleteOne.description', { title: chapter.title })}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('chapters.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </>
  )
}
