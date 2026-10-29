'use client'

import Link from 'next/link'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { CampaignStats, EntityType } from '@/lib/types'

interface Props {
  campaignId: string
  stats: CampaignStats['entities']
}

const ORDER: EntityType[] = ['npc', 'location', 'monster', 'item', 'faction', 'quest', 'note']

export default function EntitiesBreakdown({ campaignId, stats }: Props) {
  const t = useT()

  const items = ORDER.map((type) => ({
    type,
    count: stats[type] as number,
  })).filter((item) => item.count > 0)

  if (items.length === 0) return null

  return (
    <Card padding="md" className="rounded-2xl">
      <h2 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        {t('entities.breakdownTitle')}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => {
          const style = ENTITY_STYLES[item.type]
          return (
            <Link
              key={item.type}
              href={`/campaign/${campaignId}/entities?type=${item.type}`}
              className={cn(
                'flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
                style.bg,
                style.border
              )}
            >
              <span aria-hidden="true" className="text-lg">
                {style.icon}
              </span>
              <div className="min-w-0">
                <div className="text-base leading-tight font-bold text-[var(--text-primary)]">
                  {item.count}
                </div>
                <div className={cn('text-xs break-words', style.color)}>{t(style.labelKey)}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
