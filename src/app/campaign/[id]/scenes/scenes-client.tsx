'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Map, Eye, Trash2 } from 'lucide-react'
import EmptyState from '@/components/empty-state'
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

export default function ScenesClient({
  campaignId,
  initialScenes,
  isDm,
}: Props) {
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
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map size={22} className="text-emerald-400" />
            Сцены
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {scenes.length} {scenes.length === 1 ? 'сцена' : 'сцен'}
          </p>
        </div>
        {isDm && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition font-medium"
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
            isDm
              ? 'Загрузи карту подземелья или поля боя.'
              : 'ГМ пока не добавил сцены.'
          }
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition"
            >
              <Link href={`/campaign/${campaignId}/scenes/${scene.id}`}>
                <div className="aspect-video bg-slate-950 relative overflow-hidden">
                  {scene.image_url ? (
                    <img
                      src={scene.image_url}
                      alt={scene.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-700">
                      <Map size={48} />
                    </div>
                  )}
                  {scene.is_active && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                      <Eye size={10} />
                      Активна
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <h3 className="font-semibold truncate">{scene.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {scene.width}×{scene.height} клеток · {scene.grid_size}px
                </p>

                {isDm && (
                  <div className="flex items-center gap-1 mt-2">
                    {!scene.is_active && (
                      <button
                        onClick={() => handleActivate(scene.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-950/40 border border-green-900/50 text-green-300 hover:bg-green-950/60 rounded transition disabled:opacity-50"
                      >
                        <Eye size={10} />
                        Активировать
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(scene.id, scene.name)}
                      disabled={isPending}
                      className="ml-auto p-1 hover:bg-red-950/40 rounded transition disabled:opacity-50"
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
        <CreateSceneModal
          campaignId={campaignId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}