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
import { Card, Button, Dialog, Textarea } from '@/components/ui'
import { useT } from '@/lib/i18n'
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
  const t = useT()
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
        toast.error(res.error ?? t('common.error'))
        setIsVisible(!newVal)
      } else {
        toast.success(newVal ? t('entities.toast.visible') : t('entities.toast.hidden'))
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteEntity(entity.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('entities.toast.deleted'))
        router.push(`/campaign/${campaignId}/entities`)
        router.refresh()
      }
    })
  }

  return (
    <div>
      {entity.type !== 'location' && (
        <Breadcrumbs
          items={[
            { label: t('nav.dashboard'), href: '/dashboard' },
            { label: campaign.name, href: `/campaign/${campaignId}` },
            { label: t('nav.entities'), href: `/campaign/${campaignId}/entities` },
            { label: entity.name },
          ]}
          className="mb-4"
        />
      )}

      {entity.type === 'location' && locationPath && locationPath.length > 1 && (
        <LocationBreadcrumbs campaignId={campaignId} path={locationPath} />
      )}

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
          <div className="mb-1 text-xs text-[var(--text-muted)]">{t(style.labelKey)}</div>
          {isDm ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-transparent bg-transparent pb-1 text-2xl font-bold text-[var(--text-primary)] transition hover:border-[var(--border-hover)] focus:border-[var(--border-focus)] focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{name}</h1>
          )}
        </div>

        {isDm && (
          <div className="flex items-center gap-2">
            <SaveStatus status={status} lastSaved={lastSaved} error={error} />
          </div>
        )}
      </div>

      {isDm && (
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--border-default)] pb-4">
          <Button
            variant={isVisible ? 'secondary' : 'ghost'}
            size="sm"
            icon={isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            onClick={handleToggleVisibility}
            disabled={isPending}
            className={cn(
              isVisible
                ? 'border-[var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success-text)]'
                : 'border-[var(--warning)]/30 bg-[var(--warning-subtle)] text-[var(--warning-text)]'
            )}
          >
            {isVisible ? t('entities.visible') : t('entities.hidden')}
          </Button>

          <SaveAsTemplateButton
            entityId={entity.id}
            campaignId={campaignId}
            defaultName={entity.name}
          />

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      )}

      <Card padding="md">
        {isDm ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder={t('entities.descriptionPlaceholder')}
            className="border-none bg-transparent focus:ring-0"
          />
        ) : (
          <p className="whitespace-pre-wrap text-[var(--text-secondary)]">
            {description || t('entities.noDescription')}
          </p>
        )}
      </Card>

      <EntityDataForm
        entityId={entity.id}
        campaignId={campaignId}
        type={entity.type}
        initialData={entity.data_json}
        isDm={isDm}
      />

      <EntityTags
        entityId={entity.id}
        campaignId={campaignId}
        tags={entityTags}
        availableTags={availableTags}
        isDm={isDm}
      />

      {entity.type === 'location' && locationDescendants && (
        <div className="mt-8">
          <LocationChildrenTree campaignId={campaignId} descendants={locationDescendants} />
        </div>
      )}

      <EntityRelationsList
        entityId={entity.id}
        campaignId={campaignId}
        entityType={entity.type}
        relations={relations}
        allEntities={allEntities}
        isDm={isDm}
      />

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
          {t('entities.backlinksTitle')}
        </h2>
        <EntityBacklinks campaignId={campaignId} backlinks={backlinks} />
      </div>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('entities.deleteConfirm.title')}
        description={t('entities.deleteConfirm.description', { name: entity.name })}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('entities.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </div>
  )
}
