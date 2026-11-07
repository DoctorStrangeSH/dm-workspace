'use client'

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Swords,
  ChevronRight,
  X,
  Dices,
  LocateFixed,
  Shield,
  HeartPulse,
  Search,
  EyeOff,
} from 'lucide-react'
import {
  nextTurn,
  endCombat,
  rollInitiativeForToken,
  rollAllInitiatives,
  addCombatParticipants,
  startCombat,
} from '@/lib/actions/combat'
import { cn } from '@/lib/utils'
import { Button, Dialog, Input } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { orderTurns, nextTurnEntry } from '@/lib/maps/initiative'
import CombatPortrait from './combat-portrait'
import CombatConditions from './combat-conditions'
import { combatConditions, matchesCombatSearch } from '@/lib/maps/combat-conditions'
import type { InitiativeEntryWithToken } from '@/lib/types'

interface Props {
  sceneId: string
  entries: InitiativeEntryWithToken[]
  isDm: boolean
  onClose: () => void
  onFocusToken?: (tokenId: string) => void
  onBusyChange?: (busy: boolean) => void
}
export default function InitiativePanel({
  sceneId,
  entries,
  isDm,
  onClose,
  onFocusToken,
  onBusyChange,
}: Props) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const busy = useRef(false)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [withConditions, setWithConditions] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState<'end' | string | null>(null)
  const ordered = orderTurns(entries)
  const currents = ordered.filter((entry) => entry.is_current)
  const current = currents.length === 1 ? currents[0] : undefined
  const visible = ordered.filter((entry) => isDm || !entry.token.is_hidden)
  const participants = visible.map((entry, index) => ({
    entry,
    position: index + 1,
    kind: entry.token.character_id ? 'characters' : entry.token.entity_id ? 'creatures' : 'tokens',
    conditions: combatConditions(entry.token.conditions, t),
  }))
  const matches = participants.filter(
    (participant) =>
      (kind === 'all' || kind === participant.kind) &&
      (!withConditions || participant.conditions.length > 0) &&
      matchesCombatSearch(participant.entry.token.name, participant.conditions, query)
  )
  const filtered = query.trim() !== '' || kind !== 'all' || withConditions
  const resetFilters = () => {
    setQuery('')
    setKind('all')
    setWithConditions(false)
    searchInput.current?.focus()
  }
  const publicName = (entry: InitiativeEntryWithToken) =>
    isDm || !entry.token.is_hidden ? entry.token.name : t('turns.hidden')
  const next = nextTurnEntry(ordered, current?.id ?? null)
  const blocked = pending || uncertain || currents.length > 1
  useLayoutEffect(() => {
    onBusyChange?.(busy.current || pending || confirm !== null)
  }, [pending, confirm, onBusyChange])
  useEffect(() => () => onBusyChange?.(false), [onBusyChange])
  const run = (operation: () => Promise<{ error?: string }>) => {
    if (busy.current || uncertain || currents.length > 1) return
    busy.current = true
    onBusyChange?.(true)
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await operation()
        if (result.error) setError(result.error)
        else {
          router.refresh()
          setConfirm(null)
        }
      } catch {
        setError(t('map.uncertain'))
        setUncertain(true)
      } finally {
        busy.current = false
      }
    })
  }
  const roll = (entryId: string) => run(() => rollInitiativeForToken(entryId, sceneId))
  return (
    <aside
      aria-label={t('scenes.initiative.title')}
      className="flex min-w-0 flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] p-4">
        <h2 className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <Swords size={18} className="text-[var(--accent-text)]" />
          {t('scenes.initiative.title')}{' '}
          <span className="text-sm text-[var(--text-muted)]">{visible.length}</span>
        </h2>
        <Button
          variant="ghost"
          aria-label={t('common.close')}
          disabled={pending}
          onClick={onClose}
          className="min-h-11 min-w-11 !px-2"
        >
          <X size={18} />
        </Button>
      </div>
      <div
        className="space-y-3 border-b border-[var(--border-default)] bg-[var(--accent-subtle)] p-4"
        aria-live="polite"
      >
        <div>
          <p className="text-xs font-semibold tracking-wider text-[var(--accent-text)] uppercase">
            {currents.length > 1
              ? t('map.turnConflict')
              : current
                ? t('scenes.initiative.now')
                : t('map.prepare')}
          </p>
          <p className="mt-1 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {currents.length > 1
              ? t('turns.waitForSync')
              : current
                ? publicName(current)
                : t('map.prepareHint')}
          </p>
        </div>
        {next && currents.length <= 1 && (
          <p className="text-sm [overflow-wrap:anywhere] text-[var(--text-secondary)]">
            {t('map.upNext')}: <strong>{publicName(next)}</strong>
          </p>
        )}
        {isDm && entries.length > 0 && (
          <Button
            variant="primary"
            className="min-h-11 w-full"
            disabled={blocked}
            loading={pending}
            icon={<ChevronRight size={16} />}
            iconPosition="right"
            onClick={() => run(() => nextTurn(sceneId))}
          >
            {current ? t('scenes.initiative.nextTurn') : t('map.beginTurns')}
          </Button>
        )}
        {!current && isDm && entries.length > 0 && (
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            disabled={blocked}
            icon={<Dices size={17} />}
            onClick={() => run(() => rollAllInitiatives(sceneId))}
          >
            {t('map.rollAll')}
          </Button>
        )}
      </div>
      {currents.length > 1 && (
        <p role="alert" className="p-3 text-sm text-[var(--danger-text)]">
          {t('map.turnConflict')}
        </p>
      )}
      {error && (
        <p role="alert" className="p-3 text-sm text-[var(--danger-text)]">
          {error}
        </p>
      )}
      {isDm && entries.length > 0 && (
        <div className="border-b border-[var(--border-default)] p-3">
          <Button
            className="min-h-11 w-full"
            variant="secondary"
            disabled={blocked}
            onClick={() =>
              run(async () => {
                const result = await addCombatParticipants(sceneId)
                if (result.count !== undefined)
                  setNotice(t('map.participantsAdded', { count: result.count }))
                return result
              })
            }
          >
            {t('map.addParticipants')}
          </Button>
          <p className="mt-2 text-xs text-[var(--text-muted)]">{t('map.addParticipantsHint')}</p>
          {notice && (
            <p role="status" className="mt-2 text-sm">
              {notice}
            </p>
          )}
        </div>
      )}
      {entries.length > 0 && (
        <div className="space-y-3 border-b border-[var(--border-default)] p-3">
          <Input
            ref={searchInput}
            type="search"
            label={t('combatFinder.search')}
            placeholder={t('combatFinder.placeholder')}
            icon={<Search size={17} aria-hidden="true" />}
            className="min-h-11"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div role="group" aria-label={t('combatFinder.kind')} className="flex flex-wrap gap-1.5">
            {['all', 'characters', 'creatures', 'tokens'].map((value) => {
              const count =
                value === 'all'
                  ? participants.length
                  : participants.filter((p) => p.kind === value).length
              if (value !== 'all' && count === 0 && kind !== value) return null
              return (
                <Button
                  key={value}
                  variant={kind === value ? 'primary' : 'secondary'}
                  className="min-h-11 text-xs"
                  aria-pressed={kind === value}
                  onClick={() => setKind(value)}
                >
                  {t(value === 'all' ? 'combatFinder.all' : 'turns.' + value)}
                  <span className="ml-1 tabular-nums">{count}</span>
                </Button>
              )
            })}
            <Button
              variant={withConditions ? 'primary' : 'secondary'}
              className="min-h-11 text-xs"
              aria-pressed={withConditions}
              onClick={() => setWithConditions((value) => !value)}
            >
              {t('combatFinder.withConditions')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-xs text-[var(--text-secondary)]">
              {t('combatFinder.results', { shown: matches.length, total: visible.length })}
            </p>
            {filtered && (
              <Button variant="ghost" className="min-h-11 text-xs" onClick={resetFilters}>
                {t('combatFinder.reset')}
              </Button>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">{t('combatFinder.hint')}</p>
        </div>
      )}
      <ol
        aria-label={t('combatFinder.participants')}
        className="max-h-[28rem] space-y-2 overflow-y-auto p-3"
      >
        {matches.map(({ entry, position, conditions }) => {
          const active = currents.length === 1 && current?.id === entry.id
          const token = entry.token
          const hpValid =
            token.hp_current !== null &&
            token.hp_max !== null &&
            Number.isFinite(token.hp_current) &&
            Number.isFinite(token.hp_max) &&
            token.hp_current >= 0 &&
            token.hp_current <= token.hp_max &&
            token.hp_max > 0
          return (
            <li
              key={entry.id}
              aria-current={active ? 'step' : undefined}
              data-entry-id={entry.id}
              className={cn(
                'rounded-xl border p-3',
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)]'
              )}
            >
              <div className="flex items-start gap-3">
                <CombatPortrait token={token} size={36} />
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--bg-app)] text-lg font-bold text-[var(--text-primary)] tabular-nums">
                  <span className="sr-only">{t('scenes.initiative.title')}</span>
                  {entry.initiative}
                  <span className="text-[9px] leading-none text-[var(--text-muted)]">
                    #{position}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                    {token.name}
                    {token.is_hidden && isDm && (
                      <EyeOff size={13} className="ml-1 inline" aria-label={t('turns.hiddenDm')} />
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--accent-text)]">
                    {active
                      ? t('scenes.initiative.now')
                      : currents.length <= 1 && next?.id === entry.id
                        ? t('map.upNext')
                        : t('map.waiting')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                    {hpValid && (
                      <span className="flex items-center gap-1">
                        <HeartPulse size={13} /> {token.hp_current}/{token.hp_max}
                      </span>
                    )}
                    {token.ac != null && (
                      <span className="flex items-center gap-1">
                        <Shield size={13} />
                        {token.ac}
                      </span>
                    )}
                  </div>
                  <CombatConditions conditions={conditions} />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {onFocusToken && (
                  <Button
                    variant="ghost"
                    className="min-h-11 flex-1 text-xs"
                    disabled={pending}
                    icon={<LocateFixed size={15} />}
                    onClick={() => onFocusToken(token.id)}
                    aria-label={t('map.focusNamed', { name: token.name })}
                  >
                    {t('map.focus')}
                  </Button>
                )}
                {isDm && (
                  <Button
                    variant="ghost"
                    className="min-h-11 text-xs"
                    disabled={blocked}
                    aria-label={t('map.rollNamed', { name: token.name })}
                    icon={<Dices size={15} />}
                    onClick={() => (current ? setConfirm(entry.id) : roll(entry.id))}
                  >
                    {t('scenes.initiative.roll')}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {entries.length > 0 && matches.length === 0 && (
        <div className="space-y-2 px-4 pb-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {visible.length === 0 ? t('turns.noVisible') : t('combatFinder.empty')}
          </p>
        </div>
      )}
      {entries.length === 0 && (
        <div className="space-y-3 px-4 pb-4">
          <p className="text-sm text-[var(--text-muted)]">{t('scenes.initiative.empty')}</p>
          {isDm && (
            <Button
              variant="primary"
              className="min-h-11 w-full"
              disabled={blocked}
              onClick={() => run(() => startCombat(sceneId))}
            >
              {t('map.prepareCombat')}
            </Button>
          )}
        </div>
      )}
      {isDm && entries.length > 0 && (
        <div className="mt-auto border-t border-[var(--border-default)] p-3">
          <Button
            variant="ghost"
            className="min-h-11 w-full text-[var(--danger-text)]"
            disabled={blocked}
            onClick={() => setConfirm('end')}
          >
            {t('scenes.initiative.endCombat')}
          </Button>
        </div>
      )}
      <Dialog
        open={confirm !== null}
        onClose={() => {
          if (!busy.current) setConfirm(null)
        }}
        closeLabel={t('common.close')}
        closeDisabled={pending}
        title={
          confirm === 'end' ? t('scenes.initiative.endCombatConfirm.title') : t('map.rerollTitle')
        }
        description={
          confirm === 'end'
            ? t('scenes.initiative.endCombatConfirm.description')
            : t('map.rerollHint')
        }
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={pending} onClick={() => setConfirm(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={confirm === 'end' ? 'danger' : 'primary'}
              disabled={blocked}
              loading={pending}
              onClick={() =>
                confirm === 'end' ? run(() => endCombat(sceneId)) : confirm && roll(confirm)
              }
            >
              {confirm === 'end'
                ? t('scenes.initiative.endCombatConfirm.confirm')
                : t('scenes.initiative.roll')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          {confirm === 'end'
            ? t('scenes.initiative.endCombatConfirm.cannotUndo')
            : ordered.find((e) => e.id === confirm)?.token.name}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[var(--danger-text)]">
            {error}
          </p>
        )}
      </Dialog>
    </aside>
  )
}
