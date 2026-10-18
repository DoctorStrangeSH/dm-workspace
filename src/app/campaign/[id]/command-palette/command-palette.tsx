'use client'

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft } from 'lucide-react'
import { fuzzyFilter } from '@/lib/fuzzy'
import { cn } from '@/lib/utils'
import type { Command } from '@/lib/commands'
import type { Entity, Chapter } from '@/lib/types'
import EmptyState from '@/components/empty-state'

interface Props {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  campaignName: string
  chapters: Chapter[]
  entities: Entity[]
}

const KIND_LABELS: Record<string, string> = {
  action: 'Действия',
  chapter: 'Главы',
  entity: 'Сущности',
}

export default function CommandPalette({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  chapters,
  entities,
}: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = []

    // Действия
    list.push(
      {
        id: 'action:dashboard',
        kind: 'action',
        label: 'К дашборду',
        icon: '🏠',
        href: '/dashboard',
      },
      {
        id: 'action:chapters',
        kind: 'action',
        label: 'Открыть главы',
        icon: '📖',
        href: `/campaign/${campaignId}/chapters`,
      },
      {
        id: 'action:entities',
        kind: 'action',
        label: 'Открыть сущности',
        icon: '👥',
        href: `/campaign/${campaignId}/entities`,
      },
      {
        id: 'action:overview',
        kind: 'action',
        label: 'Обзор кампании',
        icon: '📊',
        href: `/campaign/${campaignId}`,
      },
      {
        id: 'action:dm-screen',
        kind: 'action',
        label: 'Открыть панель ГМа',
        icon: '🎛️',
        shortcut: '⌘M',
        action: () => {
          onClose()
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('dm-screen:open'))
          }, 100)
        },
      },
      {
        id: 'action:characters',
        kind: 'action',
        label: 'Открыть персонажей',
        icon: '⚔️',
        href: `/campaign/${campaignId}/characters`,
      },
      {
        id: 'action:bestiary',
        kind: 'action',
        label: 'Открыть бестиарий',
        icon: '🐉',
        href: `/campaign/${campaignId}/bestiary`,
      },
      {
        id: 'action:spells',
        kind: 'action',
        label: 'Открыть справочник заклинаний',
        icon: '✨',
        href: `/campaign/${campaignId}/spells`,
      },
      {
        id: 'action:items',
        kind: 'action',
        label: 'Открыть справочник предметов',
        icon: '🎒',
        href: `/campaign/${campaignId}/items`,
      },
      {
        id: 'action:scenes',
        kind: 'action',
        label: 'Открыть сцены',
        icon: '🗺️',
        href: `/campaign/${campaignId}/scenes`,
      },
    )

    // Главы
    for (const ch of chapters) {
      list.push({
        id: `chapter:${ch.id}`,
        kind: 'chapter',
        label: ch.title,
        description: 'Глава',
        icon: '📄',
        href: `/campaign/${campaignId}/chapters/${ch.id}`,
      })
    }

    // Сущности
    for (const e of entities) {
      const typeIcon =
        e.type === 'npc'
          ? '👤'
          : e.type === 'location'
            ? '🗺️'
            : e.type === 'item'
              ? '⚔️'
              : e.type === 'monster'
                ? '👹'
                : e.type === 'faction'
                  ? '🏛️'
                  : e.type === 'quest'
                    ? '📜'
                    : '📝'

      list.push({
        id: `entity:${e.id}`,
        kind: 'entity',
        label: e.name,
        description: e.description.slice(0, 60),
        icon: typeIcon,
        href: `/campaign/${campaignId}/entities/${e.id}`,
      })
    }

    return list
  }, [campaignId, chapters, entities, onClose])

  const filtered = useMemo(() => {
    return fuzzyFilter(commands, query, (cmd) =>
      [cmd.label, cmd.description ?? '', ...(cmd.keywords ?? [])].join(' ')
    )
      .slice(0, 30)
      .map((r) => r.item)
  }, [commands, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const execute = useCallback(
    (cmd: Command) => {
      if (cmd.action) {
        cmd.action()
      } else if (cmd.href) {
        onClose()
        router.push(cmd.href)
      }
    },
    [onClose, router]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) execute(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] sm:pt-[15vh] px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-y sm:border border-slate-700 sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden h-[90vh] sm:h-auto sm:max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Поиск */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <Search size={18} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск: главы, сущности, действия..."
            className="flex-1 bg-transparent text-white placeholder:text-slate-600 focus:outline-none text-base"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded">
            Esc
          </kbd>
        </div>

        {/* Список */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto py-2"
        >
{filtered.length === 0 ? (
  <div className="px-4 py-10">
    <EmptyState
      icon="🔍"
      title="Ничего не найдено"
      description={`По запросу «${query}» ничего не найдено.`}
      size="sm"
      dashed={false}
    />
  </div>
) : (
            filtered.map((cmd, i) => {
              const isActive = i === activeIndex
              const showKindLabel =
                i === 0 || filtered[i - 1].kind !== cmd.kind

              return (
                <div key={cmd.id}>
                  {showKindLabel && (
                    <div className="px-4 pt-2 pb-1 text-[10px] text-slate-600 uppercase tracking-wider">
                      {KIND_LABELS[cmd.kind]}
                    </div>
                  )}
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => execute(cmd)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-left transition',
                      isActive
                        ? 'bg-indigo-950/60 text-white'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    )}
                  >
                    <span className="text-lg shrink-0">{cmd.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {cmd.label}
                      </div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500 truncate">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isActive && !cmd.shortcut && (
                      <CornerDownLeft
                        size={12}
                        className="text-slate-500"
                      />
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Футер — только на десктопе */}
        <div className="hidden sm:flex px-4 py-2 border-t border-slate-800 items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5">
                ↑
              </kbd>
              <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5">
                ↓
              </kbd>
              навигация
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5">
                ⏎
              </kbd>
              выбрать
            </span>
          </div>
          <span>{filtered.length} результатов</span>
        </div>
      </div>
    </div>
  )
}