'use client'

import Link from 'next/link'
import { Eye, EyeOff, Link2 } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import type { Entity } from '@/lib/types'

interface Props {
  entity: Entity
  campaignId: string
  isDm: boolean
  backlinksCount?: number
}

export default function EntityCard({ entity, campaignId, isDm, backlinksCount = 0 }: Props) {
  const style = ENTITY_STYLES[entity.type]

  return (
    <Link href={`/campaign/${campaignId}/entities/${entity.id}`} className="group block">
      <Card padding="md" hoverable className="h-full">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg',
              style.bg,
              style.border
            )}
          >
            {style.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-text)]">
                {entity.name}
              </h3>
              {isDm && !entity.is_visible_to_players && (
                <span title="Скрыта от игроков" className="mt-1 shrink-0">
                  <EyeOff size={14} className="text-[var(--warning)]" />
                </span>
              )}
              {isDm && entity.is_visible_to_players && (
                <span title="Видна игрокам" className="mt-1 shrink-0">
                  <Eye size={14} className="text-[var(--success)]/60" />
                </span>
              )}
            </div>

            <div className="mb-2 text-xs text-[var(--text-muted)]">{style.label}</div>

            {entity.description && (
              <p className="line-clamp-2 text-sm text-[var(--text-muted)]">{entity.description}</p>
            )}

            {backlinksCount > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-subtle)]">
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
      </Card>
    </Link>
  )
}
