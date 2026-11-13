'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Map, Eye, Trash2 } from 'lucide-react'
import { EmptyState, Button, Dialog } from '@/components/ui'
import CreateSceneModal from './create-scene-modal'
import { deleteScene, setActiveScene } from '@/lib/actions/scenes'
import { useToast } from '@/components/toast/toast-provider'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import type { Scene } from '@/lib/types'

interface Props {
  campaignId: string
  initialScenes: Scene[]
  isDm: boolean
}

export default function ScenesClient({ campaignId, initialScenes, isDm }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const scenes = initialScenes
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('all')
  const [sort, setSort] = useState('active')
  const [error, setError] = useState<string | null>(null)
  const guard = useRef(false)
  const filtered = scenes
    .filter(
      (scene) =>
        scene.name.toLocaleLowerCase(lang).includes(search.trim().toLocaleLowerCase(lang)) &&
        (scope === 'all' ||
          (scope === 'active'
            ? scene.is_active
            : scope === 'maps'
              ? !!scene.image_url
              : !scene.image_url))
    )
    .sort((a, b) =>
      sort === 'active'
        ? Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name, lang)
        : a.name.localeCompare(b.name, lang)
    )

  const scenesPlural = (n: number) =>
    pluralize(lang, n, {
      one: t('scenes.count.one'),
      few: t('scenes.count.few'),
      many: t('scenes.count.many'),
    })

  const cellsPlural = (n: number) =>
    pluralize(lang, n, {
      one: t('scenes.cells.one'),
      few: t('scenes.cells.few'),
      many: t('scenes.cells.many'),
    })

  const handleActivate = (sceneId: string) => {
    if (!isDm || guard.current) return
    guard.current = true
    setError(null)
    startTransition(async () => {
      try {
        const res = await setActiveScene(sceneId, campaignId)
        if ('error' in res) setError(res.error ?? t('common.error'))
        else {
          toast.success(t('scenes.toast.activated'))
          router.refresh()
        }
      } catch {
        setError(t('prep.sceneUncertain'))
      } finally {
        guard.current = false
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget || !isDm || guard.current) return
    guard.current = true
    setError(null)
    startTransition(async () => {
      try {
        const res = await deleteScene(deleteTarget.id, campaignId)
        if ('error' in res) {
          setError(res.error ?? t('common.error'))
        } else {
          toast.success(t('scenes.toast.deleted'))
          setDeleteTarget(null)
          router.refresh()
        }
      } catch {
        setError(t('prep.sceneUncertain'))
      } finally {
        guard.current = false
      }
    })
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <Map size={22} className="text-[var(--success)]" />
            {t('nav.scenes')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {scenes.length} {scenesPlural(scenes.length)}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {t(isDm ? 'prep.scenesHint' : 'prep.scenesPlayerHint')}
          </p>
        </div>
        {isDm && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={18} />}
            onClick={() => setShowModal(true)}
          >
            {t('scenes.create')}
          </Button>
        )}
      </div>

      {scenes.length > 0 && (
        <section
          aria-label={t('prep.sceneFilters')}
          className="mb-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="min-w-0 text-xs text-[var(--text-muted)]">
              {t('prep.findScene')}
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-3 text-sm text-[var(--text-primary)]"
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              {t('prep.sceneSort')}
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="active">{t('prep.activeFirst')}</option>
                <option value="name">{t('sheet.inventory.name')}</option>
              </select>
            </label>
          </div>
          <div role="group" aria-label={t('prep.sceneScope')} className="mt-3 flex flex-wrap gap-2">
            {['all', 'active', 'maps', 'blank'].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                onClick={() => setScope(value)}
                className={`min-h-11 rounded-lg border px-3 text-sm ${scope === value ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'border-[var(--border-default)] text-[var(--text-secondary)]'}`}
              >
                {t('prep.scope.' + value)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span role="status">
              {t('prep.sceneFound', { count: filtered.length, total: scenes.length })}
            </span>
            <button
              type="button"
              className="min-h-11 text-[var(--accent-text)]"
              onClick={() => {
                setSearch('')
                setScope('all')
                setSort('active')
              }}
            >
              {t('spells.library.clear')}
            </button>
          </div>
        </section>
      )}
      {error && !deleteTarget && (
        <p role="alert" className="mb-3 text-sm text-[var(--danger-text)]">
          {error}
        </p>
      )}

      {scenes.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title={t('scenes.empty.title')}
          description={isDm ? t('scenes.empty.descriptionDm') : t('scenes.empty.descriptionPlayer')}
          size="lg"
          actions={
            isDm ? [{ label: t('scenes.create'), onClick: () => setShowModal(true) }] : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-[var(--border-default)] p-8 text-center text-[var(--text-muted)]">
              {t('prep.noScenes')}
            </p>
          )}
          {filtered.map((scene) => (
            <div
              key={scene.id}
              className="group overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/60 transition hover:border-[var(--border-hover)]"
            >
              <Link
                aria-label={t('prep.openScene', { name: scene.name })}
                href={`/campaign/${campaignId}/scenes/${scene.id}`}
              >
                <div className="relative aspect-video overflow-hidden bg-[var(--bg-app)]">
                  {scene.image_url ? (
                    <img
                      src={'/api/scenes/' + scene.id + '/map'}
                      alt={scene.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(var(--border-default)_1px,transparent_1px),linear-gradient(90deg,var(--border-default)_1px,transparent_1px)] bg-[size:24px_24px] text-[var(--accent-text)]">
                      <Map size={48} />
                    </div>
                  )}
                  {scene.is_active && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-[var(--success)] px-2 py-1 text-xs text-white">
                      <Eye size={10} />
                      {t('scenes.active')}
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <h2 className="font-semibold break-words text-[var(--text-primary)]">
                  {scene.name}
                </h2>
                <Link
                  className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold text-[var(--accent-text)]"
                  href={`/campaign/${campaignId}/scenes/${scene.id}`}
                >
                  {t('prep.openTable')}
                </Link>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t('scenes.dimensions', {
                    width: scene.width,
                    height: scene.height,
                    cells: cellsPlural(scene.width),
                    gridSize: scene.grid_size,
                  })}
                </p>

                {isDm && (
                  <div className="mt-2 flex items-center gap-1">
                    {!scene.is_active && (
                      <button
                        onClick={() => handleActivate(scene.id)}
                        disabled={isPending}
                        className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--success)]/40 bg-[var(--success-subtle)] px-3 text-xs text-[var(--success-text)] transition hover:bg-[var(--success-subtle)]/80 disabled:opacity-50"
                      >
                        <Eye size={10} />
                        {t('scenes.activate')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setError(null)
                        setDeleteTarget({ id: scene.id, name: scene.name })
                      }}
                      disabled={isPending}
                      className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-[var(--danger-subtle)] disabled:opacity-50"
                      aria-label={t('prep.deleteScene', { name: scene.name })}
                      title={t('common.delete')}
                    >
                      <Trash2 size={18} className="text-[var(--danger)]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateSceneModal campaignId={campaignId} onClose={() => setShowModal(false)} />
      )}

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !isPending && setDeleteTarget(null)}
        title={t('scenes.deleteConfirm.title')}
        description={
          deleteTarget ? t('scenes.deleteConfirm.description', { name: deleteTarget.name }) : ''
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        {error && (
          <p role="alert" className="mb-3 text-sm text-[var(--danger-text)]">
            {error}
          </p>
        )}
        <p className="text-sm text-[var(--text-muted)]">{t('scenes.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </>
  )
}
