'use client'

import { useId, useMemo, useState } from 'react'
import { Crosshair, EyeOff, Search, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui'
import type { Token } from '@/lib/types'
import CombatPortrait from './combat-portrait'
import styles from './map-workspace.module.css'
import CombatConditions from './combat-conditions'
import { combatConditions, matchesCombatSearch } from '@/lib/maps/combat-conditions'

export default function SceneRoster({
  tokens,
  activeTokenId,
  isDm,
  onFocus,
  onAdd,
}: {
  tokens: Token[]
  activeTokenId: string | null
  isDm: boolean
  onFocus: (id: string) => void
  onAdd: () => void
}) {
  const { lang, t } = useI18n()
  const ru = lang === 'ru'
  const effectId = useId()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'heroes' | 'creatures'>('all')
  const [effectFilter, setEffectFilter] = useState<'all' | 'affected' | 'clear'>('all')
  const rows = useMemo(
    () =>
      tokens
        .filter((token) => isDm || !token.is_hidden)
        .map((token) => ({ token, conditions: combatConditions(token.conditions, t) })),
    [tokens, isDm, t]
  )
  const filtered = rows.filter(
    ({ token, conditions }) =>
      matchesCombatSearch(token.name, conditions, query) &&
      (filter === 'all' || (filter === 'heroes' ? !!token.character_id : !token.character_id)) &&
      (effectFilter === 'all' ||
        (effectFilter === 'affected' ? conditions.length > 0 : conditions.length === 0))
  )
  const hasFilters = !!query.trim() || filter !== 'all' || effectFilter !== 'all'
  const reset = () => {
    setQuery('')
    setFilter('all')
    setEffectFilter('all')
  }
  return (
    <aside className={styles.roster} aria-label={ru ? 'Участники сцены' : 'Scene participants'}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users size={17} />
          {ru ? 'На сцене' : 'On stage'}
          <span className="text-xs text-[var(--text-muted)]">{rows.length}</span>
        </h2>
        {isDm && (
          <Button variant="ghost" size="sm" onClick={onAdd}>
            {ru ? 'Добавить' : 'Add'}
          </Button>
        )}
      </div>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-3">
        <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={ru ? 'Найти токен' : 'Find token'}
          placeholder={ru ? 'Имя или состояние…' : 'Name or condition…'}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label={ru ? 'Тип участников' : 'Participant type'}
      >
        {(['all', 'heroes', 'creatures'] as const).map((value, index) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`min-h-11 rounded-lg px-3 text-xs ${filter === value ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
          >
            {(ru ? ['Все', 'Герои', 'Существа'] : ['All', 'Heroes', 'Creatures'])[index]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label htmlFor={effectId} className="block text-xs font-medium text-[var(--text-muted)]">
          {ru ? 'Состояния участников' : 'Participant conditions'}
        </label>
        <select
          id={effectId}
          value={effectFilter}
          onChange={(event) => setEffectFilter(event.target.value as typeof effectFilter)}
          className="min-h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-3 text-sm"
        >
          <option value="all">{ru ? 'Все участники' : 'All participants'}</option>
          <option value="affected">{ru ? 'С состояниями' : 'With conditions'}</option>
          <option value="clear">{ru ? 'Без состояний' : 'Without conditions'}</option>
        </select>
        <div className="flex min-h-11 items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <p aria-live="polite" aria-atomic="true">
            {ru ? 'Показано' : 'Showing'} {filtered.length} / {rows.length}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              {ru ? 'Сбросить' : 'Reset'}
            </Button>
          )}
        </div>
      </div>
      <ul className={styles.rosterList}>
        {filtered.map(({ token, conditions }) => (
          <li key={token.id}>
            <button
              type="button"
              onClick={() => onFocus(token.id)}
              aria-label={`${ru ? 'Показать на карте' : 'Show on map'}: ${token.name}`}
              aria-describedby={
                conditions.length ? `${effectId}-${token.id}-conditions` : undefined
              }
              className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${activeTokenId === token.id ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-app)]'}`}
            >
              <CombatPortrait token={token} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{token.name}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  {activeTokenId === token.id && (
                    <span className="text-[var(--accent-text)]">
                      {ru ? 'Сейчас ходит' : 'Current turn'}
                    </span>
                  )}
                  {token.is_hidden && (
                    <span className="inline-flex items-center gap-1">
                      <EyeOff size={12} />
                      {ru ? 'Скрыт' : 'Hidden'}
                    </span>
                  )}
                </span>
                <span id={`${effectId}-${token.id}-conditions`} className="sr-only">
                  {conditions.map((condition) => condition.label).join(', ')}
                </span>
                <CombatConditions conditions={conditions} />
              </span>
              <Crosshair size={16} className="shrink-0 text-[var(--text-muted)]" />
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">
          {hasFilters
            ? ru
              ? 'Нет участников по выбранным условиям. Измените поиск или сбросьте фильтры.'
              : 'No participants match. Change your search or reset the filters.'
            : ru
              ? 'Добавьте героев и существ на карту'
              : 'Add heroes and creatures to the map'}
        </p>
      )}
      <p className="border-t border-[var(--border-default)] pt-3 text-xs leading-relaxed text-[var(--text-muted)]">
        {ru
          ? 'Выберите участника, чтобы найти его на карте. Нажмите на сам токен для HP, состояний и PNG-изображения.'
          : 'Choose a participant to locate them on the map. Click the token itself for HP, conditions and PNG art.'}
      </p>
    </aside>
  )
}
