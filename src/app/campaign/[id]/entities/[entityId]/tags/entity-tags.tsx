'use client'

import { useTransition } from 'react'
import { Hash } from 'lucide-react'
import { removeTagFromEntity } from '@/lib/actions/tags'
import { useToast } from '@/components/toast/toast-provider'
import TagChip from './tag-chip'
import TagInput from './tag-input'
import type { EntityTag, Tag } from '@/lib/types'

interface Props {
  entityId: string
  campaignId: string
  tags: EntityTag[]
  availableTags: Tag[]
  isDm: boolean
}

export default function EntityTags({
  entityId,
  campaignId,
  tags,
  availableTags,
  isDm,
}: Props) {
  const toast = useToast()
  const [startTransition] = useTransition()

  const handleRemove = (tagId: string) => {
    startTransition(async () => {
      const res = await removeTagFromEntity(entityId, tagId, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Тег удалён')
      }
    })
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Hash size={16} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Теги
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            onRemove={isDm ? handleRemove : undefined}
          />
        ))}

        {isDm && (
          <div className="flex-1 min-w-[180px] max-w-[280px]">
            <TagInput
              entityId={entityId}
              campaignId={campaignId}
              existingTags={tags}
              availableTags={availableTags}
            />
          </div>
        )}

        {!isDm && tags.length === 0 && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Нет тегов
          </span>
        )}
      </div>
    </div>
  )
}