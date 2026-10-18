import Link from 'next/link'
import { BookOpen, Users } from 'lucide-react'
import type { CampaignStats } from '@/lib/types'

interface Props {
  campaignId: string
  recent: CampaignStats['recent']
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  if (diffHour < 24) return `${diffHour} ч назад`
  if (diffDay < 7) return `${diffDay} дн назад`

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export default function RecentActivity({ campaignId, recent }: Props) {
  if (!recent || recent.length === 0) return null

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Недавняя активность
      </h2>

      <div className="space-y-1">
        {recent.map((item) => {
          const isChapter = item.type === 'chapter'
          const Icon = isChapter ? BookOpen : Users
          const href = isChapter
            ? `/campaign/${campaignId}/chapters/${item.id}`
            : `/campaign/${campaignId}/entities/${item.id}`

          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={href}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/60 transition"
            >
              <Icon
                size={16}
                className={
                  isChapter ? 'text-indigo-400 shrink-0' : 'text-emerald-400 shrink-0'
                }
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-slate-500">
                  {isChapter ? 'Глава' : 'Сущность'}
                </div>
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {formatRelativeTime(item.updated_at)}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}