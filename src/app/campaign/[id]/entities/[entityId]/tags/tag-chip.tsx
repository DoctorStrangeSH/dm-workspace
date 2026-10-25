'use client'

import { X } from 'lucide-react'
import { useT } from '@/lib/i18n'
import type { EntityTag } from '@/lib/types'

interface Props {
  tag: EntityTag
  onRemove?: (tagId: string) => void
  size?: 'sm' | 'md'
}

export default function TagChip({ tag, onRemove, size = 'md' }: Props) {
  const t = useT()
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`group inline-flex items-center gap-1 rounded-full border font-medium transition ${sizeClasses}`}
      style={{
        color: tag.color,
        backgroundColor: `${tag.color}20`,
        borderColor: `${tag.color}40`,
      }}
    >
      <span>#{tag.name}</span>
      {onRemove && (
        <button
          onClick={() => onRemove(tag.id)}
          className="rounded-full p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-white/10"
          title={t('entities.tags.removeHint')}
        >
          <X size={size === 'sm' ? 8 : 10} />
        </button>
      )}
    </span>
  )
}
