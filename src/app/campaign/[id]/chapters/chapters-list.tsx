'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import ChapterItem from './chapter-item'
import ChaptersSearch from './chapters-search'
import ChaptersSearchHotkey from './chapters-search-hotkey'
import SelectionBar from './selection-bar'
import BulkActionsBar from './bulk-actions-bar'
import { useChapterFilter } from './use-chapter-filter'
import {
  reorderChapters,
  bulkDeleteChapters,
  bulkSetVisibility,
} from '@/lib/actions/chapters'
import { getChapterForExport } from '@/lib/actions/export'
import { formatChapterAsMarkdown } from '@/lib/export-markdown'
import { downloadText } from '@/lib/download'
import { slugify } from '@/lib/slugify'
import { BookOpen, SearchX } from 'lucide-react'
import type { Chapter } from '@/lib/types'

interface Props {
  campaignId: string
  initialChapters: Chapter[]
  isDm: boolean
}

export default function ChaptersList({
  campaignId,
  initialChapters,
  isDm,
}: Props) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [query, setQuery] = useState('')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { filtered, totalCount, matchedCount, isSearching } =
    useChapterFilter(chapters, query)

  useEffect(() => {
    setChapters(initialChapters)
  }, [initialChapters])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = chapters.findIndex((c) => c.id === active.id)
    const newIndex = chapters.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const previousChapters = chapters
    const newChapters = arrayMove(chapters, oldIndex, newIndex)
    setChapters(newChapters)

    const orderedIds = newChapters.map((c) => c.id)
    const res = await reorderChapters(campaignId, orderedIds)

    if (res.error) {
      console.error('reorder failed:', res.error)
      setChapters(previousChapters)
    }
  }

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [])

  // ============================================================
  // Режим выделения
  // ============================================================
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((v) => {
      if (v) setSelectedIds(new Set())
      return !v
    })
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }, [allSelected, filtered])

 // ============================================================
  // Массовые действия
  // ============================================================
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    const confirmed = confirm(
      `Удалить ${ids.length} ${ids.length === 1 ? 'главу' : 'глав'}? Это действие нельзя отменить.`
    )
    if (!confirmed) return

    const res = await bulkDeleteChapters(ids, campaignId)
    if (res.error) {
      alert(res.error)
      return
    }
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }, [selectedIds, campaignId])

  const handleBulkSetVisibility = useCallback(
    async (visible: boolean) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      const res = await bulkSetVisibility(ids, campaignId, visible)
      if (res.error) {
        alert(res.error)
        return
      }
      setSelectedIds(new Set())
      setIsSelectionMode(false)
    },
    [selectedIds, campaignId]
  )

  const handleBulkExport = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    const parts: string[] = []
    for (const id of ids) {
      const res = await getChapterForExport(id, campaignId)
      if (res.data) {
        parts.push(formatChapterAsMarkdown(res.data))
        parts.push('\n\n---\n\n')
      }
    }

    if (parts.length === 0) return

    const content = parts.join('')
    downloadText(content, `chapters-export-${Date.now()}.md`)
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }, [selectedIds, campaignId])

  // Пустая кампания
  if (chapters.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
        <BookOpen size={40} className="text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 mb-2">Пока нет ни одной главы</p>
        <p className="text-slate-500 text-sm">
          {isDm
            ? 'Создай первую главу, чтобы начать писать приключение.'
            : 'ГМ пока не добавил главы.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <ChaptersSearchHotkey onFocus={focusSearch} />

      <div className="flex items-center gap-3 mb-4">
        <ChaptersSearch
          ref={searchInputRef}
          value={query}
          onChange={setQuery}
          totalCount={totalCount}
          matchedCount={matchedCount}
          isSearching={isSearching}
          className="flex-1"
        />

        {isDm && (
          <SelectionBar
            totalCount={filtered.length}
            selectedCount={selectedIds.size}
            allSelected={allSelected}
            onToggleMode={toggleSelectionMode}
            onToggleAll={toggleAll}
            isSelectionMode={isSelectionMode}
          />
        )}
      </div>

      {/* Ничего не найдено */}
      {isSearching && filtered.length === 0 && (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <SearchX size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Ничего не найдено</p>
          <p className="text-slate-500 text-sm">
            Попробуй изменить запрос «{query}»
          </p>
        </div>
      )}

      {/* Список */}
      {filtered.length > 0 && (
        <>
          {!isDm ? (
            <div className="space-y-2">
              {filtered.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  campaignId={campaignId}
                  isDm={false}
                  searchQuery={query}
                />
              ))}
            </div>
          ) : isSearching || isSelectionMode ? (
            <div className="space-y-2">
              {filtered.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  campaignId={campaignId}
                  isDm={true}
                  searchQuery={query}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(chapter.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          ) : (
            <DndContext
              id="chapters-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filtered.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filtered.map((chapter) => (
                    <ChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      campaignId={campaignId}
                      isDm={true}
                      searchQuery={query}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {/* Плавающая панель массовых действий */}
      {isDm && isSelectionMode && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onDelete={handleBulkDelete}
          onSetVisible={handleBulkSetVisibility}
          onExport={handleBulkExport}
        />
      )}
    </div>
  )
}