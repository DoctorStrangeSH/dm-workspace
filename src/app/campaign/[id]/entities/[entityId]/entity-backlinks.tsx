import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import type { BacklinkChapter } from '@/lib/queries/backlinks'
import EmptyState from '@/components/empty-state'

interface Props {
  campaignId: string
  backlinks: BacklinkChapter[]
}

/**
 * Выделяет упоминание [[Name]] в сниппете жирным.
 */

export default function EntityBacklinks({ campaignId, backlinks }: Props) {
  if (backlinks.length === 0) {
    return (
      <EmptyState
        icon="📖"
        title="Пока не упоминается"
        description="Эта сущность не упоминается ни в одной главе. Добавь [[Название]] в текст главы."
        size="sm"
        dashed={false}
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
        <BookOpen size={14} />
        <span>
          Упоминается в {backlinks.length} {backlinks.length === 1 ? 'главе' : 'главах'}
        </span>
      </div>

      {backlinks.map((b) => (
        <Link
          key={b.chapterId}
          href={`/campaign/${campaignId}/chapters/${b.chapterId}`}
          className="group block rounded-lg border border-slate-800 bg-slate-900/60 p-4 transition hover:border-indigo-800/60"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <h4 className="font-medium text-slate-200 transition group-hover:text-indigo-300">
              {b.chapterTitle}
            </h4>
            <ExternalLink
              size={14}
              className="mt-1 shrink-0 text-slate-600 transition group-hover:text-indigo-400"
            />
          </div>

          {b.snippets.length > 0 && (
            <div className="space-y-1.5">
              {b.snippets.map((snippet, i) => (
                <p key={i} className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                  …{snippet}…
                </p>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
