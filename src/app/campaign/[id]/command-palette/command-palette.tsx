'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft } from 'lucide-react'
import { fuzzyFilter } from '@/lib/fuzzy'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import type { Command } from '@/lib/commands'
import type { Entity, Chapter } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  campaignName: string
  chapters: Chapter[]
  entities: Entity[]
}

export default function CommandPalette({ isOpen, onClose, campaignId, chapters, entities }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const KIND_LABELS: Record<string, string> = {
    action: t('commands.kind.action'),
    chapter: t('commands.kind.chapter'),
    entity: t('commands.kind.entity'),
  }

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = []

    list.push(
      {
        id: 'action:dashboard',
        kind: 'action',
        label: t('commands.action.dashboard'),
        icon: '🏠',
        href: '/dashboard',
      },
      {
        id: 'action:overview',
        kind: 'action',
        label: t('commands.action.overview'),
        icon: '📊',
        href: `/campaign/${campaignId}`,
      },
      {
        id: 'action:chapters',
        kind: 'action',
        label: t('commands.action.chapters'),
        icon: '📖',
        href: `/campaign/${campaignId}/chapters`,
      },
      {
        id: 'action:characters',
        kind: 'action',
        label: t('commands.action.characters'),
        icon: '⚔️',
        href: `/campaign/${campaignId}/characters`,
      },
      {
        id: 'action:scenes',
        kind: 'action',
        label: t('commands.action.scenes'),
        icon: '🗺️',
        href: `/campaign/${campaignId}/scenes`,
      },
      {
        id: 'action:entities',
        kind: 'action',
        label: t('commands.action.entities'),
        icon: '👥',
        href: `/campaign/${campaignId}/entities`,
      },
      {
        id: 'action:bestiary',
        kind: 'action',
        label: t('commands.action.bestiary'),
        icon: '🐉',
        href: `/campaign/${campaignId}/bestiary`,
      },
      {
        id: 'action:spells',
        kind: 'action',
        label: t('commands.action.spells'),
        icon: '✨',
        href: `/campaign/${campaignId}/spells`,
      },
      {
        id: 'action:items',
        kind: 'action',
        label: t('commands.action.items'),
        icon: '🎒',
        href: `/campaign/${campaignId}/items`,
      },
      {
        id: 'action:dm-screen',
        kind: 'action',
        label: t('commands.action.dmScreen'),
        icon: '🎛️',
        shortcut: '⌘M',
        action: () => {
          onClose()
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('dm-screen:open'))
          }, 100)
        },
      }
    )

    for (const ch of chapters) {
      list.push({
        id: `chapter:${ch.id}`,
        kind: 'chapter',
        label: ch.title,
        description: t('commands.kind.chapter'),
        icon: '📄',
        href: `/campaign/${campaignId}/chapters/${ch.id}`,
      })
    }

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
  }, [campaignId, chapters, entities, onClose, t])

  const filtered = useMemo(() => {
    return fuzzyFilter(commands, query, (cmd) =>
      [cmd.label, cmd.description ?? '', ...(cmd.keywords ?? [])].join(' ')
    )
      .slice(0, 30)
      .map((r) => r.item)
  }, [commands, query])

  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
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

  const resultsLabel = pluralize(lang, filtered.length, {
    one: t('commands.results.one'),
    few: t('commands.results.few'),
    many: t('commands.results.many'),
  })

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[var(--bg-overlay)] px-0 pt-[5vh] backdrop-blur-sm sm:px-4 sm:pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden border-y border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xl)] sm:h-auto sm:max-h-[70vh] sm:rounded-2xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border-default)] px-4 py-3">
          <Search size={18} className="shrink-0 text-[var(--text-subtle)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commands.searchInputPlaceholder')}
            className="flex-1 bg-transparent text-base text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none"
          />
          <kbd className="hidden items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-subtle)] sm:inline-flex">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10">
              <EmptyState
                icon="🔍"
                title={t('commands.empty.title')}
                description={t('commands.empty.description', { query })}
                size="sm"
                dashed={false}
              />
            </div>
          ) : (
            filtered.map((cmd, i) => {
              const isActive = i === activeIndex
              const showKindLabel = i === 0 || filtered[i - 1].kind !== cmd.kind

              return (
                <div key={cmd.id}>
                  {showKindLabel && (
                    <div className="px-4 pt-2 pb-1 text-[10px] tracking-wider text-[var(--text-subtle)] uppercase">
                      {KIND_LABELS[cmd.kind]}
                    </div>
                  )}
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => execute(cmd)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/60'
                    )}
                  >
                    <span className="shrink-0 text-lg">{cmd.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className="truncate text-xs text-[var(--text-subtle)]">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-subtle)]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isActive && !cmd.shortcut && (
                      <CornerDownLeft size={12} className="text-[var(--text-subtle)]" />
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="hidden shrink-0 items-center justify-between border-t border-[var(--border-default)] px-4 py-2 text-xs text-[var(--text-subtle)] sm:flex">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1 py-0.5">
                ↑
              </kbd>
              <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1 py-0.5">
                ↓
              </kbd>
              {t('commands.navigation')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1 py-0.5">
                ⏎
              </kbd>
              {t('commands.select')}
            </span>
          </div>
          <span>
            {filtered.length} {resultsLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
