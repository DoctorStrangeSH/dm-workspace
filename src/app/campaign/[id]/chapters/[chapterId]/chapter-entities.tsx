import Link from 'next/link'
import { Link2 } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import type { ChapterEntity } from '@/lib/queries/backlinks'
import { cn } from '@/lib/utils'

interface Props {
  campaignId: string
  entities: ChapterEntity[]
}

export default function ChapterEntities({ campaignId, entities }: Props) {
  if (entities.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
        <p className="text-xs text-slate-500">В этой главе нет упомянутых сущностей</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
        <Link2 size={14} />
        <span>Сущности в главе ({entities.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {entities.map((e) => {
          const style = ENTITY_STYLES[e.entityType]
          return (
            <Link
              key={e.entityId}
              href={`/campaign/${campaignId}/entities/${e.entityId}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition hover:opacity-80',
                style.bg,
                style.border,
                style.color
              )}
            >
              <span>{style.icon}</span>
              <span>{e.entityName}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
