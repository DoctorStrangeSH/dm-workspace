'use client'

import { useState } from 'react'
import { Crosshair, EyeOff, Search, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui'
import type { Token } from '@/lib/types'
import CombatPortrait from './combat-portrait'
import styles from './map-workspace.module.css'

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
  const { lang } = useI18n()
  const ru = lang === 'ru'
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'heroes' | 'creatures'>('all')
  const filtered = tokens.filter(
    (token) =>
      token.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (filter === 'all' || (filter === 'heroes' ? !!token.character_id : !token.character_id))
  )
  return (
    <aside className={styles.roster} aria-label={ru ? 'Участники сцены' : 'Scene participants'}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users size={17} />
          {ru ? 'На сцене' : 'On stage'}
          <span className="text-xs text-[var(--text-muted)]">{tokens.length}</span>
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
          placeholder={ru ? 'Найти токен…' : 'Find token…'}
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
      <ul className={styles.rosterList}>
        {filtered.map((token) => (
          <li key={token.id}>
            <button
              type="button"
              onClick={() => onFocus(token.id)}
              aria-label={`${ru ? 'Показать на карте' : 'Show on map'}: ${token.name}`}
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
                  {Array.isArray(token.conditions) && token.conditions.length > 0 && (
                    <span>
                      {token.conditions.length} {ru ? 'эфф.' : 'effects'}
                    </span>
                  )}
                </span>
              </span>
              <Crosshair size={16} className="shrink-0 text-[var(--text-muted)]" />
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">
          {query
            ? ru
              ? 'Никого не найдено'
              : 'No matches'
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
