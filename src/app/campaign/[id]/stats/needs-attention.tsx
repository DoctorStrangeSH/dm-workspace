import Link from 'next/link'
import { AlertCircle, Check, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { CampaignStats } from '@/lib/types'
import type { Lang } from '@/lib/i18n/types'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

interface Props {
  campaignId: string
  stats: CampaignStats
  lang: Lang
}

export default function NeedsAttention({ campaignId, stats, lang }: Props) {
  const t = createT(getDictionary(lang))
  const issues: Array<{
    label: string
    href: string
    count: number
  }> = []

  if (stats.chapters.empty > 0) {
    issues.push({
      label: t('overview.emptyChapters', { count: stats.chapters.empty }),
      href: `/campaign/${campaignId}/chapters`,
      count: stats.chapters.empty,
    })
  }

  if (stats.entities.no_description > 0) {
    issues.push({
      label: t('overview.noDescriptions', { count: stats.entities.no_description }),
      href: `/campaign/${campaignId}/entities`,
      count: stats.entities.no_description,
    })
  }

  if (stats.entities_without_stats > 0) {
    issues.push({
      label: t('overview.noCombatStats', { count: stats.entities_without_stats }),
      href: `/campaign/${campaignId}/entities?type=monster`,
      count: stats.entities_without_stats,
    })
  }

  if (issues.length === 0)
    return (
      <Card padding="md" className="h-full rounded-2xl">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Check size={18} className="text-[var(--success-text)]" aria-hidden="true" />
          {t('overview.attention')}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{t('overview.noIssues')}</p>
      </Card>
    )

  return (
    <Card
      padding="md"
      className="h-full rounded-2xl border-[var(--warning)]/30 bg-[var(--warning-subtle)]"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-[var(--warning-text)] uppercase">
        <AlertCircle size={16} aria-hidden="true" />
        {t('overview.attention')}
      </h2>

      <div className="space-y-2">
        {issues.map((issue) => (
          <Link
            key={issue.href}
            href={issue.href}
            className="group flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <span className="text-sm text-[var(--warning-text)]">{issue.label}</span>
            <ChevronRight
              size={14}
              aria-hidden="true"
              className="shrink-0 text-[var(--warning-text)] transition group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </Card>
  )
}
