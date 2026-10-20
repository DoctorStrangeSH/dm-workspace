'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Map, Eye, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import CreateSceneModal from './create-scene-modal'
import { deleteScene, setActiveScene } from '@/lib/actions/scenes'
import { useToast } from '@/components/toast/toast-provider'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { Scene } from '@/lib/types'

interface Props {
  campaignId: string
  initialScenes: Scene[]
  isDm: boolean
}

export default function ScenesClient({ campaignId, initialScenes, isDm }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const scenes = initialScenes

  const handleActivate = (sceneId: string) => {
    startTransition(async () => {
      const res = await setActiveScene(sceneId, campaignId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Сцена активирована')
        router.refresh()
      }
    })
  }

  const handleDelete = (sceneId: string, name: string) => {
    if (!confirm(`Удалить сцену «${name}»?`)) return
    startTransition(async () => {
      const res = await deleteScene(sceneId, campaignId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Сцена удалена')
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Map size={22} className="text-emerald-400" />
            Сцены
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {scenes.length} {scenes.length === 1 ? 'сцена' : 'сцен'}
          </p>
        </div>
        {isDm && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500"
          >
            <Plus size={18} />
            Новая сцена
          </button>
        )}
      </div>

      {scenes.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="Пока нет сцен"
          description={
            isDm ? 'Загрузи карту подземелья или поля боя.' : 'ГМ пока не добавил сцены.'
          }
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 transition hover:border-slate-700"
            >
              <Link href={`/campaign/${campaignId}/scenes/${scene.id}`}>
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  {scene.image_url ? (
                    <img
                      src={scene.image_url}
                      alt={scene.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-700">
                      <Map size={48} />
                    </div>
                  )}
                  {scene.is_active && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs text-white">
                      <Eye size={10} />
                      Активна
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <h3 className="truncate font-semibold">{scene.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {scene.width}×{scene.height} клеток · {scene.grid_size}px
                </p>

                {isDm && (
                  <div className="mt-2 flex items-center gap-1">
                    {!scene.is_active && (
                      <button
                        onClick={() => handleActivate(scene.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 rounded border border-green-900/50 bg-green-950/40 px-2 py-1 text-xs text-green-300 transition hover:bg-green-950/60 disabled:opacity-50"
                      >
                        <Eye size={10} />
                        Активировать
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(scene.id, scene.name)}
                      disabled={isPending}
                      className="ml-auto rounded p-1 transition hover:bg-red-950/40 disabled:opacity-50"
                      title="Удалить"
                    >
                      <Trash2 size={12} className="text-red-400" />
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
    </>
  )
}
