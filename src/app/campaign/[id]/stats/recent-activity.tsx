import Link from 'next/link'
import { ArrowUpRight, BookOpen, Clock, Users } from 'lucide-react'
import { Card } from '@/components/ui'
import type { CampaignStats } from '@/lib/types'
import type { Lang } from '@/lib/i18n/types'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import { campaignRelativeTime } from '@/lib/campaign-overview-time'

interface Props {
  campaignId: string
  recent: CampaignStats['recent']
  lang: Lang
  now: number
}

export default function RecentActivity({ campaignId, recent, lang, now }: Props) {
  const t = createT(getDictionary(lang))
  const entries = recent ?? []

  return (
    <Card padding="md" className="h-full min-w-0 rounded-2xl">
      <h2 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        <Clock
          size={16}
          className="mr-2 inline-block text-[var(--accent-text)]"
          aria-hidden="true"
        />
        {t('overview.recent')}
      </h2>

      {entries.length === 0 && (
        <p className="text-sm leading-6 text-[var(--text-muted)]">{t('overview.noRecent')}</p>
      )}
      <div className="space-y-1">
        {entries.map((item) => {
          const isChapter = item.type === 'chapter'
          const Icon = isChapter ? BookOpen : Users
          const href = isChapter
            ? `/campaign/${campaignId}/chapters/${item.id}`
            : `/campaign/${campaignId}/entities/${item.id}`

          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={href}
              className="group flex min-h-16 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <Icon
                aria-hidden="true"
                size={18}
                className={`shrink-0 ${
                  isChapter ? 'text-[var(--accent-text)]' : 'text-[var(--success-text)]'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[var(--text-primary)]">{item.name}</div>
                <div className="text-xs text-[var(--text-subtle)]">
                  {t(isChapter ? 'overview.chapter' : 'overview.entity')}
                </div>
              </div>
              <span className="ml-7 text-xs text-[var(--text-subtle)] sm:ml-0">
                {campaignRelativeTime(item.updated_at, lang, now)}
              </span>
              <ArrowUpRight
                size={14}
                className="hidden shrink-0 text-[var(--text-subtle)] sm:block"
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
