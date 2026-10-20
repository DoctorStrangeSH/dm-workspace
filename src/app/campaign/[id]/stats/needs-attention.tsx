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
    <div className="mb-8 rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-amber-300 uppercase">
        <AlertCircle size={14} />
        Требует внимания
      </h2>

      <div className="space-y-2">
        {issues.map((issue, i) => (
          <Link
            key={i}
            href={issue.href}
            className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition hover:bg-amber-950/30"
          >
            <span className="text-sm text-amber-200">{issue.label}</span>
            <ChevronRight
              size={14}
              className="shrink-0 text-amber-500 transition group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
