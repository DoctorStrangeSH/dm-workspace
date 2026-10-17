import Link from 'next/link'
import { AlertCircle, ChevronRight } from 'lucide-react'
import type { CampaignStats } from '@/lib/types'

interface Props {
  campaignId: string
  stats: CampaignStats
}

export default function NeedsAttention({ campaignId, stats }: Props) {
  const issues: Array<{
    label: string
    href: string
    count: number
  }> = []

  if (stats.chapters.empty > 0) {
    issues.push({
      label: `${stats.chapters.empty} ${stats.chapters.empty === 1 ? 'глава' : 'глав'} без содержимого`,
      href: `/campaign/${campaignId}/chapters`,
      count: stats.chapters.empty,
    })
  }

  if (stats.entities.no_description > 0) {
    issues.push({
      label: `${stats.entities.no_description} ${stats.entities.no_description === 1 ? 'сущность' : 'сущностей'} без описания`,
      href: `/campaign/${campaignId}/entities`,
      count: stats.entities.no_description,
    })
  }

  if (stats.entities_without_stats > 0) {
    issues.push({
      label: `${stats.entities_without_stats} ${stats.entities_without_stats === 1 ? 'монстр' : 'монстров'} без AC/HP`,
      href: `/campaign/${campaignId}/entities?type=monster`,
      count: stats.entities_without_stats,
    })
  }

  if (issues.length === 0) return null

  return (
    <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-5 mb-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-300 uppercase tracking-wider mb-4">
        <AlertCircle size={14} />
        Требует внимания
      </h2>

      <div className="space-y-2">
        {issues.map((issue, i) => (
          <Link
            key={i}
            href={issue.href}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-amber-950/30 transition group"
          >
            <span className="text-sm text-amber-200">{issue.label}</span>
            <ChevronRight
              size={14}
              className="text-amber-500 group-hover:translate-x-0.5 transition shrink-0"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}