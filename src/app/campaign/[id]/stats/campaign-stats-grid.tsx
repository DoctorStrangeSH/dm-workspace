import Link from 'next/link'
import { BookOpen, Users, Link2, Hash, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { CampaignStats } from '@/lib/types'
import type { Lang } from '@/lib/i18n/types'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'

interface Props {
  campaignId: string
  stats: CampaignStats
  lang: Lang
  isDm: boolean
}

export default function CampaignStatsGrid({ campaignId, stats, lang, isDm }: Props) {
  const base = `/campaign/${campaignId}`
  const t = createT(getDictionary(lang))

  const items = [
    {
      label: t('nav.chapters'),
      icon: BookOpen,
      href: `${base}/chapters`,
      color: 'text-[var(--accent-text)]',
      value: stats.chapters.total,
      subtext:
        isDm && stats.chapters.hidden > 0
          ? t('overview.chapterVisibility', {
              visible: stats.chapters.visible,
              hidden: stats.chapters.hidden,
            })
          : stats.chapters.total > 0
            ? t('overview.chaptersReady')
            : t('overview.noneYet'),
    },
    {
      label: t('nav.entities'),
      icon: Users,
      href: `${base}/entities`,
      color: 'text-[var(--success-text)]',
      value: stats.entities.total,
      subtext: stats.entities.total > 0 ? t('overview.entitiesReady') : t('overview.noneYet'),
    },
    {
      label: t('overview.relations'),
      icon: Link2,
      href: `${base}/entities`,
      color: 'text-[var(--info-text)]',
      value: stats.relations,
      subtext: t(stats.relations > 0 ? 'overview.relationsHint' : 'overview.noneYet'),
    },
    {
      label: t('overview.tags'),
      icon: Hash,
      href: `${base}/entities`,
      color: 'text-[var(--warning-text)]',
      value: stats.tags,
      subtext: t(stats.tags > 0 ? 'overview.tagsHint' : 'overview.noneYet'),
    },
  ]

  return (
    <section aria-label={t('overview.statistics')}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <Card
                padding="md"
                hoverable
                className="relative h-full min-h-36 overflow-hidden rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--accent)]/40 group-hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-secondary)]">
                    <Icon size={18} className={item.color} aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-[var(--text-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                  {item.value}
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                  {item.label}
                </div>
                <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-subtle)]">
                  {item.subtext}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
