import Link from 'next/link'
import { BookOpen, Users } from 'lucide-react'
import { Card } from '@/components/ui'
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
    <Card padding="md" className="mb-8">
      <h2 className="mb-4 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
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
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--bg-hover)]"
            >
              <Icon
                size={16}
                className={`shrink-0 ${
                  isChapter ? 'text-[var(--accent-text)]' : 'text-[var(--success-text)]'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[var(--text-primary)]">{item.name}</div>
                <div className="text-xs text-[var(--text-subtle)]">
                  {isChapter ? 'Глава' : 'Сущность'}
                </div>
              </div>
              <span className="shrink-0 text-xs text-[var(--text-subtle)]">
                {formatRelativeTime(item.updated_at)}
              </span>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
