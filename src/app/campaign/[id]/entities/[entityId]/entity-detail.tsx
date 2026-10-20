'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { updateEntity, deleteEntity } from '@/lib/actions/entities'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { useAutosave } from '@/lib/hooks/use-autosave'
import { useToast } from '@/components/toast/toast-provider'
import { Breadcrumbs } from '@/components/breadcrumbs'
import SaveStatus from '../../chapters/[chapterId]/save-status'
import EntityBacklinks from './entity-backlinks'
import EntityDataForm from './entity-data-form'
import EntityRelationsList from './relations/entity-relations-list'
import EntityTags from './tags/entity-tags'
import SaveAsTemplateButton from './save-as-template-button'
import LocationBreadcrumbs from './locations/location-breadcrumbs'
import LocationChildrenTree from './locations/location-children-tree'
import { cn } from '@/lib/utils'
import type { Entity, EntityRelation, EntityTag, Tag, EntityType } from '@/lib/types'
import type { BacklinkChapter } from '@/lib/queries/backlinks'

interface Props {
  entity: Entity
  campaign: { id: string; name: string }
  campaignId: string
  isDm: boolean
  backlinks: BacklinkChapter[]
  relations: EntityRelation[]
  allEntities: Entity[]
  entityTags: EntityTag[]
  availableTags: Tag[]
  locationPath?: Array<{
    entityId: string
    entityName: string
    entityType: EntityType
  }>
  locationDescendants?: Array<{
    entityId: string
    entityName: string
    depth: number
  }>
}

export default function EntityDetail({
  entity,
  campaign,
  campaignId,
  isDm,
  backlinks,
  relations,
  allEntities,
  entityTags,
  availableTags,
  locationPath,
  locationDescendants,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(entity.name)
  const [description, setDescription] = useState(entity.description)
  const [isVisible, setIsVisible] = useState(entity.is_visible_to_players)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const style = ENTITY_STYLES[entity.type]

  const handleSave = useCallback(
    async (data: { name: string; description: string }) => {
      return updateEntity(entity.id, campaignId, {
        name: data.name,
        description: data.description,
      })
    },
    [entity.id, campaignId]
  )

  const { status, lastSaved, error } = useAutosave({
    value: { name, description },
    onSave: handleSave,
    delay: 1500,
    enabled: isDm,
  })

  const handleToggleVisibility = () => {
    const newVal = !isVisible
    setIsVisible(newVal)
    startTransition(async () => {
      const res = await updateEntity(entity.id, campaignId, {
        is_visible_to_players: newVal,
      })
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setIsVisible(!newVal)
      } else {
        toast.success(newVal ? 'Сущность видна игрокам' : 'Сущность скрыта от игроков')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteEntity(entity.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Сущность удалена')
        router.push(`/campaign/${campaignId}/entities`)
        router.refresh()
      }
    })
  }

  return (
    <div>
      {/* Общие крошки (кроме локаций — у них свои) */}
      {entity.type !== 'location' && (
        <Breadcrumbs
          items={[
            { label: 'Дашборд', href: '/dashboard' },
            { label: campaign.name, href: `/campaign/${campaignId}` },
            { label: 'Сущности', href: `/campaign/${campaignId}/entities` },
            { label: entity.name },
          ]}
          className="mb-4"
        />
      )}

      {/* Крошки локаций (иерархия) */}
      {entity.type === 'location' && locationPath && locationPath.length > 1 && (
        <LocationBreadcrumbs campaignId={campaignId} path={locationPath} />
      )}

      {/* Заголовок */}
      <div className="mb-6 flex items-start gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-2xl',
            style.bg,
            style.border
          )}
        >
          {style.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs text-slate-500">{style.label}</div>
          {isDm ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-transparent bg-transparent pb-1 text-2xl font-bold transition hover:border-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold">{name}</h1>
          )}
        </div>

        {isDm && (
          <div className="flex items-center gap-2">
            <SaveStatus status={status} lastSaved={lastSaved} error={error} />
          </div>
        )}
      </div>

      {/* Панель управления (только ГМ) */}
      {isDm && (
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={handleToggleVisibility}
            disabled={isPending}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition',
              isVisible
                ? 'border-green-900/50 bg-green-950/40 text-green-300'
                : 'border-amber-900/50 bg-amber-950/40 text-amber-300'
            )}
          >
            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            {isVisible ? 'Видна игрокам' : 'Скрыта'}
          </button>

          <SaveAsTemplateButton
            entityId={entity.id}
            campaignId={campaignId}
            defaultName={entity.name}
          />

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-950/60"
          >
            <Trash2 size={14} />
            Удалить
          </button>
        </div>
      )}

      {/* Описание */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        {isDm ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Описание, лор, внешность..."
            className="w-full resize-none border-none bg-transparent text-slate-200 focus:outline-none"
          />
        ) : (
          <p className="whitespace-pre-wrap text-slate-300">
            {description || 'Описание отсутствует'}
          </p>
        )}
      </div>

      {/* Структурированные поля (data_json) */}
      <EntityDataForm
        entityId={entity.id}
        campaignId={campaignId}
        type={entity.type}
        initialData={entity.data_json}
        isDm={isDm}
      />

      {/* Теги */}
      <EntityTags
        entityId={entity.id}
        campaignId={campaignId}
        tags={entityTags}
        availableTags={availableTags}
        isDm={isDm}
      />

      {/* Вложенные локации */}
      {entity.type === 'location' && locationDescendants && (
        <div className="mt-8">
          <LocationChildrenTree campaignId={campaignId} descendants={locationDescendants} />
        </div>
      )}

      {/* Связи */}
      <EntityRelationsList
        entityId={entity.id}
        campaignId={campaignId}
        entityType={entity.type}
        relations={relations}
        allEntities={allEntities}
        isDm={isDm}
      />

      {/* Беклинки */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Упоминается в</h2>
        <EntityBacklinks campaignId={campaignId} backlinks={backlinks} />
      </div>

      {/* Подтверждение удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-2 text-lg font-semibold">Удалить сущность?</h3>
            <p className="mb-6 text-sm text-slate-400">«{entity.name}» будет удалена навсегда.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 transition hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
