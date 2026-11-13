'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  LocateFixed,
  Shield,
  Swords,
  Circle,
  EyeOff,
  Rows3,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { orderTurns, nextTurnEntry } from '@/lib/maps/initiative'
import type { InitiativeEntryWithToken } from '@/lib/types'
import CombatPortrait from './combat-portrait'
import CombatConditions from './combat-conditions'
import { combatConditions } from '@/lib/maps/combat-conditions'
import styles from './turn-timeline.module.css'

interface Props {
  entries: InitiativeEntryWithToken[]
  isDm: boolean
  onFocusToken: (id: string) => void
  onOpenPanel: (opener: HTMLElement) => void
}

export default function TurnTimeline({ entries, isDm, onFocusToken, onOpenPanel }: Props) {
  const t = useT()
  const listId = useId()
  const rail = useRef<HTMLOListElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [compact, setCompact] = useState(true)
  const ordered = orderTurns(entries).filter((entry) => entry.token)
  const visible = ordered.filter((entry) => isDm || !entry.token.is_hidden)
  const currents = ordered.filter((entry) => entry.is_current)
  const conflict = currents.length > 1
  const current = currents.length === 1 ? currents[0] : undefined
  const next = nextTurnEntry(ordered, current?.id ?? null)
  const currentId = current?.id
  const currentName = current
    ? isDm || !current.token.is_hidden
      ? current.token.name
      : t('turns.hidden')
    : null
  const nextName = next
    ? isDm || !next.token.is_hidden
      ? next.token.name
      : t('turns.hidden')
    : null
  const heroes = visible.filter((entry) => entry.token.character_id).length
  const creatures = visible.filter(
    (entry) => !entry.token.character_id && entry.token.entity_id
  ).length
  const other = visible.length - heroes - creatures
  const centerCurrent = () => {
    const list = rail.current
    const card = list?.querySelector<HTMLElement>('[aria-current="step"]')
    if (!list || !card) return
    const lr = list.getBoundingClientRect()
    const cr = card.getBoundingClientRect()
    list.scrollLeft += cr.left + cr.width / 2 - lr.left - list.clientWidth / 2
  }
  useEffect(() => {
    if (expanded) return
    const list = rail.current
    const card = list?.querySelector<HTMLElement>('[aria-current="step"]')
    if (!list || !card) return
    const lr = list.getBoundingClientRect()
    const cr = card.getBoundingClientRect()
    list.scrollLeft += cr.left + cr.width / 2 - lr.left - list.clientWidth / 2
  }, [currentId, expanded, compact])

  if (ordered.length === 0) return null
  return (
    <section
      aria-label={t('turns.title')}
      className="mb-4 min-w-0 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <ListOrdered size={18} className="text-[var(--accent-text)]" />
            {t('turns.title')}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
            {[
              { Icon: Shield, count: heroes, key: 'turns.characters' },
              { Icon: Swords, count: creatures, key: 'turns.creatures' },
              { Icon: Circle, count: other, key: 'turns.tokens' },
            ].map(({ Icon, count, key }) =>
              count > 0 ? (
                <span key={key} className="inline-flex items-center gap-1">
                  <Icon size={12} aria-hidden="true" />
                  {t(key)}: <strong className="tabular-nums">{count}</strong>
                </span>
              ) : null
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            className="min-h-11 min-w-11 !px-2 text-xs"
            title={t('turns.compact')}
            aria-pressed={compact}
            onClick={() => setCompact((value) => !value)}
          >
            <Rows3 size={16} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t('turns.compact')}</span>
          </Button>
          <Button
            variant="ghost"
            className="min-h-11 !px-2 text-xs"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t('turns.collapse') : t('turns.showAll')}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 !px-2 text-xs"
            onClick={(event) => onOpenPanel(event.currentTarget)}
          >
            {t('scenes.combatPanel')}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--accent-subtle)] px-4 py-3">
        <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          <p className="text-xs font-semibold tracking-wider text-[var(--accent-text)] uppercase">
            {conflict
              ? t('map.turnConflict')
              : current
                ? t('scenes.initiative.now')
                : t('map.prepare')}
          </p>
          <p className="mt-1 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {conflict ? t('turns.waitForSync') : (currentName ?? t('map.prepareHint'))}
          </p>
          {!conflict && nextName && (
            <p className="mt-1 text-xs [overflow-wrap:anywhere] text-[var(--text-secondary)]">
              {current ? t('map.upNext') : t('turns.first')}: <strong>{nextName}</strong>
            </p>
          )}
        </div>
        {!expanded && (
          <div className={styles.navigation}>
            <Button
              variant="ghost"
              className="min-h-11 min-w-11 !px-2"
              aria-label={t('turns.scrollBack')}
              onClick={() =>
                rail.current?.scrollBy({ left: -Math.max(140, rail.current.clientWidth * 0.7) })
              }
            >
              <ChevronLeft size={18} />
            </Button>
            {current && (isDm || !current.token.is_hidden) && (
              <Button
                variant="ghost"
                className="min-h-11 min-w-11 !px-2"
                aria-label={t('turns.current')}
                onClick={centerCurrent}
              >
                <LocateFixed size={18} />
              </Button>
            )}
            <Button
              variant="ghost"
              className="min-h-11 min-w-11 !px-2"
              aria-label={t('turns.scrollForward')}
              onClick={() =>
                rail.current?.scrollBy({ left: Math.max(140, rail.current.clientWidth * 0.7) })
              }
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </div>
      <ol
        ref={rail}
        id={listId}
        tabIndex={0}
        aria-label={t('turns.queue')}
        className={cn(styles.rail, expanded && styles.expanded, compact && styles.compact)}
      >
        {visible.map((entry, index) => {
          const conditions = combatConditions(entry.token.conditions, t)
          const active = !conflict && current?.id === entry.id
          const isNext = !conflict && !!current && next?.id === entry.id && !active
          const status = active
            ? t('scenes.initiative.now')
            : isNext
              ? t('map.upNext')
              : !current && !conflict && next?.id === entry.id
                ? t('turns.first')
                : t('map.waiting')
          const kind = entry.token.character_id
            ? t('turns.character')
            : entry.token.entity_id
              ? t('turns.creature')
              : t('turns.token')
          return (
            <li
              key={entry.id}
              aria-current={active ? 'step' : undefined}
              data-entry-id={entry.id}
              className={styles.item}
            >
              <button
                type="button"
                onClick={() => onFocusToken(entry.token.id)}
                aria-label={
                  t('turns.focus', {
                    position: index + 1,
                    name: entry.token.name,
                    initiative: entry.initiative,
                    status,
                  }) +
                  (conditions.length
                    ? '. ' +
                      t('combatFinder.conditions') +
                      ': ' +
                      conditions.map((condition) => condition.label).join(', ')
                    : '')
                }
                className={cn(
                  styles.card,
                  'relative flex h-full w-full flex-col items-center rounded-xl border p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)] shadow-[0_0_0_1px_var(--accent)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--accent)]',
                  isNext && 'border-dashed border-[var(--accent)]'
                )}
              >
                <span
                  className={cn(
                    styles.scores,
                    'mb-2 flex w-full items-center justify-between gap-1 text-[10px] font-semibold text-[var(--text-muted)]'
                  )}
                >
                  <span>#{index + 1}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 tabular-nums',
                      active
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
                    )}
                    title={t('turns.initiative')}
                  >
                    {entry.initiative}
                  </span>
                </span>
                <span className={styles.portrait}>
                  <CombatPortrait token={entry.token} size={compact ? 32 : 48} />
                </span>
                <span
                  className={cn(
                    styles.name,
                    'mt-2 w-full text-xs font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]'
                  )}
                >
                  {entry.token.name}
                </span>
                <span
                  className={cn(
                    styles.kind,
                    'mt-1 flex flex-wrap items-center justify-center gap-1 text-[10px] text-[var(--text-muted)]'
                  )}
                >
                  {kind}
                  {entry.token.is_hidden && <EyeOff size={11} aria-label={t('turns.hiddenDm')} />}
                </span>
                <div className={styles.conditions}>
                  <CombatConditions conditions={conditions} compact />
                </div>
                <span
                  className={cn(
                    styles.turnStatus,
                    'mt-auto pt-2 text-[10px] font-semibold',
                    active || isNext ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                  )}
                >
                  {status}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="px-4 pb-3 text-xs text-[var(--text-muted)]">
        {visible.length > 0 ? t('turns.hint') : t('turns.noVisible')}
      </p>
    </section>
  )
}
