import Link from 'next/link'
import { BookOpen, Users, Link2, Hash, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { CampaignStats } from '@/lib/types'

interface Props {
  campaignId: string
  stats: CampaignStats
}

export default function CampaignStatsGrid({ campaignId, stats }: Props) {
  const base = `/campaign/${campaignId}`

  const items = [
    {
      label: 'Главы',
      icon: BookOpen,
      href: `${base}/chapters`,
      color: 'text-[var(--accent-text)]',
      value: stats.chapters.total,
      subtext:
        stats.chapters.hidden > 0
          ? `${stats.chapters.visible} видимых, ${stats.chapters.hidden} скрытых`
          : stats.chapters.total > 0
            ? 'все видимы'
            : 'пока нет',
    },
    {
      label: 'Сущности',
      icon: Users,
      href: `${base}/entities`,
      color: 'text-[var(--success-text)]',
      value: stats.entities.total,
      subtext:
        stats.entities.npc + stats.entities.monster + stats.entities.location > 0
          ? `${stats.entities.npc} NPC, ${stats.entities.monster} монстров, ${stats.entities.location} локаций`
          : 'пока нет',
    },
    {
      label: 'Связи',
      icon: Link2,
      href: `${base}/entities`,
      color: 'text-[var(--info-text)]',
      value: stats.relations,
      subtext: stats.relations > 0 ? 'между сущностями' : 'пока нет',
    },
    {
      label: 'Теги',
      icon: Hash,
      href: `${base}/entities`,
      color: 'text-[var(--warning-text)]',
      value: stats.tags,
      subtext: stats.tags > 0 ? 'уникальных' : 'пока нет',
    },
  ]

  return (
    <section className="mb-8" aria-label="Статистика кампании">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <Card padding="md" hoverable className="relative h-full min-h-36 overflow-hidden rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--accent)]/40 group-hover:shadow-[var(--shadow-md)]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-secondary)]">
                    <Icon size={18} className={item.color} aria-hidden="true" />
                  </span>
                  <ArrowUpRight size={16} className="text-[var(--text-subtle)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
                <div className="text-3xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">{item.value}</div>
                <div className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{item.label}</div>
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
