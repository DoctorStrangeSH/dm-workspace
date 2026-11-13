'use client'

import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Button, EmptyState, Input, Select } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { ENTITY_FILTERS, ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import type { EntityTemplate, EntityType } from '@/lib/types'
import type { EntityCardData } from './entity-card'
import EntityCard from './entity-card'
import CreateEntityButton from './create-entity-button'

interface Props {
  campaignId: string
  entities: EntityCardData[]
  templates: EntityTemplate[]
  backlinksCounts: Record<string, number>
  isDm: boolean
  initialType: EntityType | 'all'
}

const normalize = (value: string) => value.toLocaleLowerCase().replaceAll('ё', 'е')

export default function EntitiesWorkspace({
  campaignId,
  entities,
  templates,
  backlinksCounts,
  isDm,
  initialType,
}: Props) {
  const t = useT()
  const [type, setType] = useState(initialType)
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [sort, setSort] = useState('recent')
  // Defence in depth: hidden entries never contribute to player counts or search.
  const accessible = entities.filter((entity) => isDm || entity.is_visible_to_players)
  const terms = normalize(search).trim().split(/\s+/).filter(Boolean)
  const matching = accessible.filter((entity) => {
    const text = normalize(`${entity.name} ${entity.description ?? ''}`)
    return (
      terms.every((term) => text.includes(term)) &&
      (!isDm || visibility === 'all' || entity.is_visible_to_players === (visibility === 'visible'))
    )
  })
  const visible = matching.filter((entity) => type === 'all' || entity.type === type)
  visible.sort((a, b) =>
    sort === 'name'
      ? a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
      : b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id)
  )
  const reset = () => {
    setSearch('')
    setVisibility('all')
    setType('all')
    setSort('recent')
  }
  const filtered =
    search.trim() !== '' || type !== 'all' || visibility !== 'all' || sort !== 'recent'

  return (
    <section aria-label={t('entities.library.title')} className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Users size={24} className="shrink-0 text-[var(--success)]" aria-hidden="true" />
            {t('entities.library.title')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
            {t(isDm ? 'entities.library.hintDm' : 'entities.onlyVisible')}
          </p>
        </div>
        {isDm && (
          <CreateEntityButton
            campaignId={campaignId}
            defaultType={type === 'all' ? undefined : type}
            templates={templates}
          />
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 sm:col-span-2">
            <Input
              type="search"
              label={t('entities.library.search')}
              placeholder={t('entities.library.searchHint')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              icon={<Search size={18} />}
              className="min-h-11"
            />
          </div>
          {isDm && (
            <Select
              label={t('entities.library.visibility')}
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              className="min-h-11"
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'visible', label: t('entities.visible') },
                { value: 'hidden', label: t('entities.hidden') },
              ]}
            />
          )}
          <Select
            label={t('entities.library.sort')}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="min-h-11"
            options={[
              { value: 'recent', label: t('entities.library.recent') },
              { value: 'name', label: t('entities.library.byName') },
            ]}
          />
        </div>
        <div role="group" aria-label={t('entities.form.type')} className="flex flex-wrap gap-2">
          {ENTITY_FILTERS.map(({ value }) => {
            const label = value === 'all' ? t('common.all') : t(ENTITY_STYLES[value].labelKey)
            const count = matching.filter(
              (entity) => value === 'all' || entity.type === value
            ).length
            return (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                  type === value
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                )}
              >
                {value !== 'all' && <span aria-hidden="true">{ENTITY_STYLES[value].icon}</span>}
                {label}
                <span className="text-xs tabular-nums">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" aria-live="polite" className="text-sm text-[var(--text-muted)]">
          {t('entities.library.results', { shown: visible.length, total: accessible.length })}
        </p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={reset} className="min-h-11">
            {t('entities.library.reset')}
          </Button>
        )}
      </div>
      {visible.length > 0 ? (
        <div
          data-testid="entity-library-results"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              campaignId={campaignId}
              isDm={isDm}
              backlinksCount={backlinksCounts[entity.id] ?? 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📚"
          title={t(
            accessible.length === 0 ? 'entities.empty.titleAll' : 'entities.library.noMatches'
          )}
          description={t(
            accessible.length === 0
              ? isDm
                ? 'entities.empty.descriptionDm'
                : 'entities.empty.descriptionPlayer'
              : 'entities.library.tryReset'
          )}
          size="lg"
        />
      )}
    </section>
  )
}
