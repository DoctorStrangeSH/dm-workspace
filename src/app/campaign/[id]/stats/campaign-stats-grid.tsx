import Link from 'next/link'
import { BookOpen, Users, Link2, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      color: 'text-indigo-400',
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
      color: 'text-emerald-400',
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
      color: 'text-sky-400',
      value: stats.relations,
      subtext: stats.relations > 0 ? 'между сущностями' : 'пока нет',
    },
    {
      label: 'Теги',
      icon: Hash,
      href: `${base}/entities`,
      color: 'text-amber-400',
      value: stats.tags,
      subtext: stats.tags > 0 ? 'уникальных' : 'пока нет',
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
          >
            <Icon size={18} className={cn(item.color, 'mb-2')} />
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="mb-1 text-xs text-slate-400">{item.label}</div>
            <div className="line-clamp-2 text-[10px] text-slate-500">{item.subtext}</div>
          </Link>
        )
      })}
    </div>
  )
}
