'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, Trash2, Pencil, Check, X, FileText, GripVertical, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/toast/toast-provider'
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
        toast.error(res.error ?? 'Ошибка')
        setTitle(chapter.title)
      } else {
        toast.success('Глава переименована')
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
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success(willBeVisible ? 'Глава видна игрокам' : 'Глава скрыта от игроков')
      }
    })
  }

  const handleDuplicate = () => {
    startTransition(async () => {
      const res = await duplicateChapter(chapter.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Копия главы создана')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteChapter(chapter.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Глава удалена')
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
          'group rounded-xl border bg-[var(--bg-surface)] transition-colors',
          isSelected
            ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
            : 'border-[var(--border-default)] hover:border-[var(--border-hover)]',
          isDragging && 'border-[var(--accent)] shadow-[var(--shadow-xl)]'
        )}
      >
        <div className="flex items-center gap-3 p-4">
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
              title="Перетащи, чтобы изменить порядок"
            >
              <GripVertical size={18} />
            </div>
          )}

          <FileText size={18} className="shrink-0 text-[var(--accent-text)]" />

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
                  className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Сохранить"
                  onClick={handleSaveTitle}
                  disabled={isPending}
                  className="text-[var(--success)]"
                >
                  <Check size={14} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Отмена"
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
                <h3 className="truncate font-medium text-[var(--text-primary)]">
                  <HighlightedText text={chapter.title} query={searchQuery} />
                </h3>
                {!chapter.is_visible_to_players && isDm && (
                  <span className="text-xs text-[var(--warning-text)]/80">Скрыта от игроков</span>
                )}
              </button>
            ) : (
              <Link href={`/campaign/${campaignId}/chapters/${chapter.id}`} className="block">
                <h3 className="truncate font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-text)]">
                  <HighlightedText text={chapter.title} query={searchQuery} />
                </h3>
                {!chapter.is_visible_to_players && isDm && (
                  <span className="text-xs text-[var(--warning-text)]/80">Скрыта от игроков</span>
                )}
              </Link>
            )}
          </div>

          {isDm && !isEditing && !isSelectionMode && (
            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <IconButton
                variant="ghost"
                size="sm"
                label={chapter.is_visible_to_players ? 'Скрыть от игроков' : 'Показать игрокам'}
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
                label="Переименовать"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
              >
                <Pencil size={16} />
              </IconButton>

              <IconButton
                variant="ghost"
                size="sm"
                label="Дублировать главу"
                onClick={handleDuplicate}
                disabled={isPending}
              >
                <Copy size={16} />
              </IconButton>

              <IconButton
                variant="ghost"
                size="sm"
                label="Удалить"
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
        title="Удалить главу?"
        description={`«${chapter.title}» будет удалена со всем содержимым. Восстановить нельзя.`}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">Это действие нельзя отменить.</p>
      </Dialog>
    </>
  )
}
