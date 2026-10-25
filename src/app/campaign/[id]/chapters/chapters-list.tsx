'use client'

import { useState, useRef, useCallback } from 'react'
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
import { reorderChapters, bulkDeleteChapters, bulkSetVisibility } from '@/lib/actions/chapters'
import { getChapterForExport } from '@/lib/actions/export'
import { formatChapterAsMarkdown } from '@/lib/export-markdown'
import { downloadText } from '@/lib/download'
import { useToast } from '@/components/toast/toast-provider'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import { EmptyState, Button, Dialog } from '@/components/ui'
import type { Chapter } from '@/lib/types'

interface Props {
  campaignId: string
  initialChapters: Chapter[]
  isDm: boolean
  onCreateChapter?: () => void
}

export default function ChaptersList({
  campaignId,
  initialChapters,
  isDm,
  onCreateChapter,
}: Props) {
  const { t, lang } = useI18n()
  const toast = useToast()
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [query, setQuery] = useState('')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [prevInitial, setPrevInitial] = useState(initialChapters)
  if (initialChapters !== prevInitial) {
    setPrevInitial(initialChapters)
    setChapters(initialChapters)
  }

  const { filtered, totalCount, matchedCount, isSearching } = useChapterFilter(chapters, query)

  // CHANGES (К8): chaptersPlural обёрнут в useCallback,
  // чтобы не ругался react-hooks/exhaustive-deps в confirmBulkDelete,
  // handleBulkSetVisibility, handleBulkExport.
  const chaptersPlural = useCallback(
    (n: number) =>
      pluralize(lang, n, {
        one: t('chapters.count.one'),
        few: t('chapters.count.few'),
        many: t('chapters.count.many'),
      }),
    [lang, t]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

    if ('error' in res) {
      console.error('reorder failed:', res.error)
      toast.error(t('chapters.toast.reorderFailed'))
      setChapters(previousChapters)
    }
  }

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [])

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

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }, [allSelected, filtered])

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    setShowDeleteConfirm(true)
  }, [selectedIds])

  const confirmBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setIsDeleting(true)
    const res = await bulkDeleteChapters(ids, campaignId)
    setIsDeleting(false)
    if ('error' in res) {
      toast.error(res.error ?? t('common.error'))
      return
    }
    toast.success(t('chapters.toast.deleted', { n: ids.length, label: chaptersPlural(ids.length) }))
    setSelectedIds(new Set())
    setIsSelectionMode(false)
    setShowDeleteConfirm(false)
  }, [selectedIds, campaignId, toast, t, chaptersPlural])

  const handleBulkSetVisibility = useCallback(
    async (visible: boolean) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      const res = await bulkSetVisibility(ids, campaignId, visible)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(
        visible
          ? t('chapters.toast.shown', { n: ids.length, label: chaptersPlural(ids.length) })
          : // CHANGES: hiddenBulk (не hidden — это одиночное «Глава скрыта»)
            t('chapters.toast.hiddenBulk', { n: ids.length, label: chaptersPlural(ids.length) })
      )
      setSelectedIds(new Set())
      setIsSelectionMode(false)
    },
    [selectedIds, campaignId, toast, t, chaptersPlural]
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

    if (parts.length === 0) {
      toast.error(t('chapters.toast.exportFailed'))
      return
    }

    const content = parts.join('')
    downloadText(content, `chapters-export-${Date.now()}.md`)
    toast.success(
      t('chapters.toast.exported', { n: ids.length, label: chaptersPlural(ids.length) })
    )
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }, [selectedIds, campaignId, toast, t, chaptersPlural])

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon="📖"
        title={t('chapters.empty.title')}
        description={
          isDm ? t('chapters.empty.descriptionDm') : t('chapters.empty.descriptionPlayer')
        }
        size="lg"
        actions={
          isDm && onCreateChapter
            ? [{ label: t('chapters.create'), onClick: onCreateChapter }]
            : undefined
        }
      />
    )
  }

  return (
    <div>
      <ChaptersSearchHotkey onFocus={focusSearch} />

      <div className="mb-4 flex items-center gap-3">
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

      {isSearching && filtered.length === 0 && (
        <EmptyState
          icon="🔍"
          title={t('chapters.search.noResultsTitle')}
          description={t('chapters.search.noResultsDescription', { query })}
          size="md"
          actions={[
            {
              label: t('chapters.search.clear'),
              onClick: () => setQuery(''),
              variant: 'secondary',
            },
          ]}
        />
      )}

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

      {isDm && isSelectionMode && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onDelete={handleBulkDelete}
          onSetVisible={handleBulkSetVisibility}
          onExport={handleBulkExport}
        />
      )}

      <Dialog
        open={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title={t('chapters.deleteConfirm.title')}
        description={t('chapters.deleteConfirm.description', {
          n: selectedIds.size,
          label: chaptersPlural(selectedIds.size),
        })}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={confirmBulkDelete} loading={isDeleting}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('chapters.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </div>
  )
}
