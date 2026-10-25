'use client'

import { useState, useTransition } from 'react'
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
    startTransition(async () => {
      const res = await setActiveScene(sceneId, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('scenes.toast.activated'))
        router.refresh()
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteScene(deleteTarget.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('scenes.toast.deleted'))
        setDeleteTarget(null)
        router.refresh()
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

      {scenes.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title={t('scenes.empty.title')}
          description={isDm ? t('scenes.empty.descriptionDm') : t('scenes.empty.descriptionPlayer')}
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="group overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/60 transition hover:border-[var(--border-hover)]"
            >
              <Link href={`/campaign/${campaignId}/scenes/${scene.id}`}>
                <div className="relative aspect-video overflow-hidden bg-[var(--bg-app)]">
                  {scene.image_url ? (
                    <img
                      src={scene.image_url}
                      alt={scene.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--text-subtle)]">
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
                <h3 className="truncate font-semibold text-[var(--text-primary)]">{scene.name}</h3>
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
                        className="flex items-center gap-1 rounded border border-[var(--success)]/40 bg-[var(--success-subtle)] px-2 py-1 text-xs text-[var(--success-text)] transition hover:bg-[var(--success-subtle)]/80 disabled:opacity-50"
                      >
                        <Eye size={10} />
                        {t('scenes.activate')}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget({ id: scene.id, name: scene.name })}
                      disabled={isPending}
                      className="ml-auto rounded p-1 transition hover:bg-[var(--danger-subtle)] disabled:opacity-50"
                      title={t('common.delete')}
                    >
                      <Trash2 size={12} className="text-[var(--danger)]" />
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
        <p className="text-sm text-[var(--text-muted)]">{t('scenes.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </>
  )
}
