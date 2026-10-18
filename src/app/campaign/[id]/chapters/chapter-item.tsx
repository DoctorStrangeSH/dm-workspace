'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Check,
  X,
  FileText,
  GripVertical,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/toast/toast-provider'
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id, disabled: !isDm || isSelectionMode })

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
      const res = await toggleChapterVisibility(
        chapter.id,
        campaignId,
        willBeVisible
      )
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success(
          willBeVisible ? 'Глава видна игрокам' : 'Глава скрыта от игроков'
        )
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
          'group bg-slate-900/60 border rounded-xl transition',
          isSelected
            ? 'border-indigo-600 bg-indigo-950/20'
            : 'border-slate-800 hover:border-slate-700',
          isDragging && 'border-indigo-600 shadow-2xl shadow-indigo-900/40'
        )}
      >
        <div className="flex items-center gap-3 p-4">
          {isSelectionMode && (
            <button
              onClick={() => onToggleSelect?.(chapter.id)}
              className={cn(
                'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition',
                isSelected
                  ? 'bg-indigo-600 border-indigo-500'
                  : 'border-slate-700 hover:border-slate-500'
              )}
              title={isSelected ? 'Снять выделение' : 'Выделить'}
            >
              {isSelected && <Check size={12} className="text-white" />}
            </button>
          )}

          {isDm && !isSelectionMode && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 shrink-0 touch-none"
              title="Перетащи, чтобы изменить порядок"
            >
              <GripVertical size={18} />
            </div>
          )}

          <FileText size={18} className="text-indigo-400 shrink-0" />

          <div className="flex-1 min-w-0">
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
                  className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={isPending}
                  className="p-1 hover:bg-slate-800 rounded transition"
                >
                  <Check size={14} className="text-green-400" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  className="p-1 hover:bg-slate-800 rounded transition"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
            ) : isSelectionMode ? (
              <button
                onClick={() => onToggleSelect?.(chapter.id)}
                className="block w-full text-left"
              >
                <h3 className="font-medium truncate">
                  <HighlightedText
                    text={chapter.title}
                    query={searchQuery}
                  />
                </h3>
                {!chapter.is_visible_to_players && isDm && (
                  <span className="text-xs text-amber-400/80">
                    Скрыта от игроков
                  </span>
                )}
              </button>
            ) : (
              <Link
                href={`/campaign/${campaignId}/chapters/${chapter.id}`}
                className="block"
              >
                <h3 className="font-medium truncate hover:text-indigo-400 transition">
                  <HighlightedText
                    text={chapter.title}
                    query={searchQuery}
                  />
                </h3>
                {!chapter.is_visible_to_players && isDm && (
                  <span className="text-xs text-amber-400/80">
                    Скрыта от игроков
                  </span>
                )}
              </Link>
            )}
          </div>

          {isDm && !isEditing && !isSelectionMode && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={handleToggleVisibility}
                disabled={isPending}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
                title={
                  chapter.is_visible_to_players
                    ? 'Скрыть от игроков'
                    : 'Показать игрокам'
                }
              >
                {chapter.is_visible_to_players ? (
                  <Eye size={16} className="text-green-400" />
                ) : (
                  <EyeOff size={16} className="text-slate-500" />
                )}
              </button>

              <button
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
                title="Переименовать"
              >
                <Pencil size={16} className="text-slate-400" />
              </button>

              <button
                onClick={handleDuplicate}
                disabled={isPending}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
                title="Дублировать главу"
              >
                <Copy size={16} className="text-slate-400" />
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="p-2 hover:bg-red-950/50 rounded-lg transition"
                title="Удалить"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Удалить главу?</h3>
            <p className="text-slate-400 text-sm mb-6">
              «{chapter.title}» будет удалена со всем содержимым. Восстановить
              нельзя.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50"
              >
                {isPending ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}