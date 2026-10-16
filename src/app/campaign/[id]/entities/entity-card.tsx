'use client'

import Link from 'next/link'
import { Eye, EyeOff, Link2 } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import type { Entity } from '@/lib/types'

interface Props {
  entity: Entity
  campaignId: string
  isDm: boolean
  backlinksCount?: number
}

export default function EntityCard({
  entity,
  campaignId,
  isDm,
  backlinksCount = 0,
}: Props) {
  const style = ENTITY_STYLES[entity.type]

  return (
    <Link
      href={`/campaign/${campaignId}/entities/${entity.id}`}
      className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition block"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center text-lg',
            style.bg,
            style.border
          )}
        >
          {style.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate group-hover:text-indigo-400 transition">
              {entity.name}
            </h3>
            {isDm && !entity.is_visible_to_players && (
              <EyeOff
                size={14}
                className="text-amber-400 shrink-0 mt-1"
                title="Скрыта от игроков"
              />
            )}
            {isDm && entity.is_visible_to_players && (
              <Eye
                size={14}
                className="text-green-400/60 shrink-0 mt-1"
                title="Видна игрокам"
              />
            )}
          </div>

          <div className="text-xs text-slate-500 mb-2">{style.label}</div>

          {entity.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {entity.description}
            </p>
          )}

          {backlinksCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
              <Link2 size={12} />
              <span>
                {backlinksCount}{' '}
                {backlinksCount === 1
                  ? 'упоминание'
                  : backlinksCount < 5
                    ? 'упоминания'
                    : 'упоминаний'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}