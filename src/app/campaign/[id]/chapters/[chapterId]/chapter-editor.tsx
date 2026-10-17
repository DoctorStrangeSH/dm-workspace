'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import type { ViewUpdate } from '@codemirror/view'
import { updateChapterContent } from '@/lib/actions/chapter-content'
import { getChapterForExport } from '@/lib/actions/export'
import { formatChapterAsMarkdown } from '@/lib/export-markdown'
import { downloadText } from '@/lib/download'
import { toFilename } from '@/lib/slugify'
import { useAutosave } from '@/lib/hooks/use-autosave'
import { useHotkey } from '@/lib/hooks/use-hotkey'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import EditorToolbar, { type ViewMode } from './editor-toolbar'
import CMEditor from './cm-editor'
import MarkdownPreview from './markdown-preview'
import WikilinkDropdown from './wikilink-dropdown'
import ExportChapterButton from './export-chapter-button'
import type { EntitySuggestion } from '@/lib/codemirror/wikilink-completion'

interface Props {
  chapterId: string
  campaignId: string
  initialContent: string
  readOnly?: boolean
  entityMap?: Record<string, string>
  entities?: EntitySuggestion[]
  chapterTitle: string
}

interface Trigger {
  isOpen: boolean
  query: string
  start: number
  end: number
  position: { top: number; left: number } | null
}

export default function ChapterEditor({
  chapterId,
  campaignId,
  initialContent,
  readOnly = false,
  entityMap,
  entities = [],
  chapterTitle,
}: Props) {
  const isMobile = useIsMobile()
  const [content, setContent] = useState(initialContent)
  const [view, setView] = useState<ViewMode>('split')
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const cmRef = useRef<ReactCodeMirrorRef>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const lastOpenTimeRef = useRef(0)

  const [trigger, setTrigger] = useState<Trigger>({
    isOpen: false,
    query: '',
    start: 0,
    end: 0,
    position: null,
  })

  const handleSave = useCallback(
    async (value: string) => {
      return updateChapterContent(chapterId, campaignId, value)
    },
    [chapterId, campaignId]
  )

  const { status, lastSaved, error, saveNow } = useAutosave({
    value: content,
    onSave: handleSave,
    delay: 1500,
    enabled: !readOnly,
  })

  // ============================================================
  // Хоткей Ctrl+E — экспорт
  // ============================================================
  const handleExportHotkey = useCallback(async () => {
    const res = await getChapterForExport(chapterId, campaignId)
    if (res.error || !res.data) return
    const markdown = formatChapterAsMarkdown(res.data)
    downloadText(markdown, toFilename(chapterTitle, 'md'))
  }, [chapterId, campaignId, chapterTitle])

  useHotkey({
    code: 'KeyE',
    ctrl: true,
    ignoreInInputs: false,
    handler: (e) => {
      e.preventDefault()
      handleExportHotkey()
    },
  })

  // ============================================================
  // На мобиле split недоступен
  // ============================================================
  useEffect(() => {
    if (isMobile && view === 'split') {
      setView('edit')
    }
  }, [isMobile, view])

  // ============================================================
  // Детект [[query
  // ============================================================
  const checkTrigger = useCallback(() => {
    const cmView = cmRef.current?.view
    if (!cmView) return

    const pos = cmView.state.selection.main.from
    const textBefore = cmView.state.sliceDoc(Math.max(0, pos - 500), pos)
    const match = textBefore.match(/\[\[([^\]]*)$/)

    if (!match) {
      const timeSinceOpen = Date.now() - lastOpenTimeRef.current
      if (timeSinceOpen < 300) return
      setTrigger((t) => (t.isOpen ? { ...t, isOpen: false } : t))
      return
    }

    const query = match[1]
    const start = pos - query.length - 2

    const coords = cmView.coordsAtPos(pos)
    const wrapper = wrapperRef.current
    if (!coords || !wrapper) return

    const wrapperRect = wrapper.getBoundingClientRect()

    lastOpenTimeRef.current = Date.now()
    setTrigger({
      isOpen: true,
      query,
      start,
      end: pos,
      position: {
        top: coords.bottom - wrapperRect.top + 4,
        left: coords.left - wrapperRect.left,
      },
    })
  }, [])

  const handleEditorUpdate = useCallback(
    (viewUpdate: ViewUpdate) => {
      if (viewUpdate.docChanged || viewUpdate.selectionSet) {
        checkTrigger()
      }
    },
    [checkTrigger]
  )

  // ============================================================
  // Выбор сущности из dropdown
  // ============================================================
  const handleSelect = useCallback(
    (entity: EntitySuggestion) => {
      const cmView = cmRef.current?.view
      if (!cmView) return

      const afterCursor = cmView.state.sliceDoc(
        trigger.end,
        trigger.end + 2
      )
      const hasClosingBrackets = afterCursor === ']]'

      cmView.dispatch({
        changes: {
          from: trigger.start,
          to: hasClosingBrackets ? trigger.end + 2 : trigger.end,
          insert: `[[${entity.name}]]`,
        },
        selection: {
          anchor: trigger.start + entity.name.length + 4,
        },
      })

      setTrigger((t) => ({ ...t, isOpen: false }))
      cmView.focus()
    },
    [trigger.start, trigger.end]
  )

  // ============================================================
  // Быстрая вставка сниппетов
  // ============================================================
  const handleInsert = useCallback((snippet: string, wrap = false) => {
    const view = cmRef.current?.view
    if (!view) return

    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)

    let insertText = snippet
    let cursorOffset = snippet.length

    if (wrap) {
      if (selected) {
        if (snippet.startsWith('**')) {
          insertText = `**${selected}**`
        } else if (snippet.startsWith('*')) {
          insertText = `*${selected}*`
        } else if (snippet.startsWith('`')) {
          insertText = `\`${selected}\``
        } else {
          insertText = snippet
        }
        cursorOffset = insertText.length
      } else {
        insertText = snippet
        if (snippet.startsWith('**')) cursorOffset = 2
        else if (snippet.startsWith('*')) cursorOffset = 1
        else if (snippet.startsWith('`')) cursorOffset = 1
        else cursorOffset = snippet.length
      }
    }

    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: from + cursorOffset },
    })
    view.focus()
  }, [])

  const showEditor = isMobile
    ? mobileView === 'edit'
    : view === 'edit' || view === 'split'
  const showPreview = isMobile
    ? mobileView === 'preview'
    : view === 'preview' || view === 'split'

  return (
    <div className="flex flex-col">
      {/* Мобильные табы */}
      {isMobile && !readOnly && (
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 mb-3">
          <button
            onClick={() => setMobileView('edit')}
            className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
              mobileView === 'edit'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Редактор
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
              mobileView === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Просмотр
          </button>
        </div>
      )}

      <EditorToolbar
        view={view}
        onViewChange={setView}
        status={status}
        lastSaved={lastSaved}
        error={error}
        readOnly={readOnly}
        onInsert={handleInsert}
        exportButton={
          <ExportChapterButton
            chapterId={chapterId}
            campaignId={campaignId}
            chapterTitle={chapterTitle}
          />
        }
        hideViewModes={isMobile}
      />

      <div
        className={isMobile ? '' : 'grid gap-3'}
        style={
          isMobile
            ? undefined
            : {
                gridTemplateColumns:
                  showEditor && showPreview ? '1fr 1fr' : '1fr',
              }
        }
      >
        {showEditor && (
          <div
            ref={wrapperRef}
            className="relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-[calc(100vh-320px)] sm:h-[700px]"
          >
            <CMEditor
              ref={cmRef}
              value={content}
              onChange={setContent}
              readOnly={readOnly}
              onSave={saveNow}
              entities={entities}
              onUpdate={handleEditorUpdate}
            />

            {trigger.isOpen && trigger.position && !readOnly && (
              <WikilinkDropdown
                query={trigger.query}
                entities={entities}
                position={trigger.position}
                onSelect={handleSelect}
                onClose={() =>
                  setTrigger((t) => ({ ...t, isOpen: false }))
                }
              />
            )}
          </div>
        )}

        {showPreview && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-auto h-[calc(100vh-320px)] sm:h-[700px] p-6">
            {content.trim() ? (
              <MarkdownPreview
                content={content}
                campaignId={campaignId}
                entityMap={entityMap}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                Превью появится, когда ты начнёшь писать
              </div>
            )}
          </div>
        )}
      </div>

      {readOnly && (
        <div className="mt-3 text-xs text-slate-500 text-center">
          Режим просмотра — редактирование доступно только ГМу
        </div>
      )}
    </div>
  )
}