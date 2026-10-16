import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import type { BacklinkChapter } from '@/lib/queries/backlinks'

interface Props {
  campaignId: string
  backlinks: BacklinkChapter[]
}

/**
 * Выделяет упоминание [[Name]] в сниппете жирным.
 */
function highlightSnippet(snippet: string, entityName: string): string {
  return snippet.replace(
    new RegExp(`\\[\\[${escapeRegExp(entityName)}\\]\\]`, 'g'),
    `**[[${entityName}]]**`
  )
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function EntityBacklinks({ campaignId, backlinks }: Props) {
  if (backlinks.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 text-center">
        <BookOpen size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          Пока не упоминается ни в одной главе
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
        <BookOpen size={14} />
        <span>
          Упоминается в {backlinks.length}{' '}
          {backlinks.length === 1 ? 'главе' : 'главах'}
        </span>
      </div>

      {backlinks.map((b) => (
        <Link
          key={b.chapterId}
          href={`/campaign/${campaignId}/chapters/${b.chapterId}`}
          className="group block bg-slate-900/60 border border-slate-800 hover:border-indigo-800/60 rounded-lg p-4 transition"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="font-medium text-slate-200 group-hover:text-indigo-300 transition">
              {b.chapterTitle}
            </h4>
            <ExternalLink
              size={14}
              className="text-slate-600 group-hover:text-indigo-400 shrink-0 mt-1 transition"
            />
          </div>

          {b.snippets.length > 0 && (
            <div className="space-y-1.5">
              {b.snippets.map((snippet, i) => (
                <p
                  key={i}
                  className="text-xs text-slate-500 line-clamp-2 leading-relaxed"
                >
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