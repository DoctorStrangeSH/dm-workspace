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
import type {
  Entity,
  EntityRelation,
  EntityTag,
  Tag,
  EntityType,
} from '@/lib/types'
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
      if (res.error) {
        toast.error(res.error)
        setIsVisible(!newVal)
      } else {
        toast.success(
          newVal ? 'Сущность видна игрокам' : 'Сущность скрыта от игроков'
        )
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteEntity(entity.id, campaignId)
      if (res.error) {
        toast.error(res.error)
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
      {entity.type === 'location' &&
        locationPath &&
        locationPath.length > 1 && (
          <LocationBreadcrumbs
            campaignId={campaignId}
            path={locationPath}
          />
        )}

      {/* Заголовок */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            'shrink-0 w-14 h-14 rounded-xl border flex items-center justify-center text-2xl',
            style.bg,
            style.border
          )}
        >
          {style.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500 mb-1">{style.label}</div>
          {isDm ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition pb-1"
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
        <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-800">
          <button
            onClick={handleToggleVisibility}
            disabled={isPending}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition border',
              isVisible
                ? 'bg-green-950/40 border-green-900/50 text-green-300'
                : 'bg-amber-950/40 border-amber-900/50 text-amber-300'
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-red-950/40 border border-red-900/50 text-red-300 hover:bg-red-950/60 transition"
          >
            <Trash2 size={14} />
            Удалить
          </button>
        </div>
      )}

      {/* Описание */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        {isDm ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Описание, лор, внешность..."
            className="w-full bg-transparent border-none text-slate-200 focus:outline-none resize-none"
          />
        ) : (
          <p className="text-slate-300 whitespace-pre-wrap">
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
          <LocationChildrenTree
            campaignId={campaignId}
            descendants={locationDescendants}
          />
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
        <h2 className="text-lg font-semibold mb-3">Упоминается в</h2>
        <EntityBacklinks
          campaignId={campaignId}
          backlinks={backlinks}
        />
      </div>

      {/* Подтверждение удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Удалить сущность?</h3>
            <p className="text-slate-400 text-sm mb-6">
              «{entity.name}» будет удалена навсегда.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50"
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