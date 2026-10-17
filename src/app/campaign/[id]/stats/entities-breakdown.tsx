import Link from 'next/link'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import type { CampaignStats, EntityType } from '@/lib/types'

interface Props {
  campaignId: string
  stats: CampaignStats['entities']
}

const ORDER: EntityType[] = [
  'npc',
  'location',
  'monster',
  'item',
  'faction',
  'quest',
]

export default function EntitiesBreakdown({ campaignId, stats }: Props) {
  const items = ORDER.map((type) => ({
    type,
    count: stats[type] as number,
  })).filter((item) => item.count > 0)

  if (items.length === 0) return null

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Разбивка сущностей
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => {
          const style = ENTITY_STYLES[item.type]
          return (
            <Link
              key={item.type}
              href={`/campaign/${campaignId}/entities?type=${item.type}`}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition hover:opacity-80',
                style.bg,
                style.border
              )}
            >
              <span className="text-lg">{style.icon}</span>
              <div className="min-w-0">
                <div className="text-base font-bold leading-tight">
                  {item.count}
                </div>
                <div className={cn('text-[10px] truncate', style.color)}>
                  {style.label}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}