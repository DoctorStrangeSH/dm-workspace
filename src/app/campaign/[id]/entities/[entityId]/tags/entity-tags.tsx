'use client'

import { useTransition } from 'react'
import { Hash } from 'lucide-react'
import { removeTagFromEntity } from '@/lib/actions/tags'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
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

export default function EntityTags({ entityId, campaignId, tags, availableTags, isDm }: Props) {
  const t = useT()
  const toast = useToast()
  const [, startTransition] = useTransition()

  const handleRemove = (tagId: string) => {
    startTransition(async () => {
      const res = await removeTagFromEntity(entityId, tagId, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('entities.tags.toast.removed'))
      }
    })
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Hash size={16} className="text-[var(--text-muted)]" />
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t('entities.tags.title')}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} onRemove={isDm ? handleRemove : undefined} />
        ))}

        {isDm && (
          <div className="max-w-[280px] min-w-[180px] flex-1">
            <TagInput
              entityId={entityId}
              campaignId={campaignId}
              existingTags={tags}
              availableTags={availableTags}
            />
          </div>
        )}

        {!isDm && tags.length === 0 && (
          <span className="text-sm text-[var(--text-muted)]">{t('entities.tags.empty')}</span>
        )}
      </div>
    </div>
  )
}
