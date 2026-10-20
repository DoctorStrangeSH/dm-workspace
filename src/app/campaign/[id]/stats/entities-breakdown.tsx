import Link from 'next/link'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import type { CampaignStats, EntityType } from '@/lib/types'

interface Props {
  campaignId: string
  stats: CampaignStats['entities']
}

const ORDER: EntityType[] = ['npc', 'location', 'monster', 'item', 'faction', 'quest']

export default function EntitiesBreakdown({ campaignId, stats }: Props) {
  const items = ORDER.map((type) => ({
    type,
    count: stats[type] as number,
  })).filter((item) => item.count > 0)

  if (items.length === 0) return null

  return (
    <Card padding="md" className="mb-8">
      <h2 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        Разбивка сущностей
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => {
          const style = ENTITY_STYLES[item.type]
          return (
            <Link
              key={item.type}
              href={`/campaign/${campaignId}/entities?type=${item.type}`}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 transition-opacity hover:opacity-80',
                style.bg,
                style.border
              )}
            >
              <span className="text-lg">{style.icon}</span>
              <div className="min-w-0">
                <div className="text-base leading-tight font-bold text-[var(--text-primary)]">
                  {item.count}
                </div>
                <div className={cn('truncate text-[10px]', style.color)}>{style.label}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
