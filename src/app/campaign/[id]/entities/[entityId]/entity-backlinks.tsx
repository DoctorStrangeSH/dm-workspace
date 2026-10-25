'use client'

import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import type { BacklinkChapter } from '@/lib/queries/backlinks'

interface Props {
  campaignId: string
  backlinks: BacklinkChapter[]
}

export default function EntityBacklinks({ campaignId, backlinks }: Props) {
  const { t, lang } = useI18n()

  if (backlinks.length === 0) {
    return (
      <EmptyState
        icon="📖"
        title={t('entities.backlinks.empty.title')}
        description={t('entities.backlinks.empty.description')}
        size="sm"
        dashed={false}
      />
    )
  }

  const chaptersLabel = pluralize(lang, backlinks.length, {
    one: t('entities.mentionsChapters.one'),
    few: t('entities.mentionsChapters.few'),
    many: t('entities.mentionsChapters.many'),
  })

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <BookOpen size={14} />
        <span>{t('entities.mentionsIn', { n: backlinks.length, label: chaptersLabel })}</span>
      </div>

      {backlinks.map((b) => (
        <Link
          key={b.chapterId}
          href={`/campaign/${campaignId}/chapters/${b.chapterId}`}
          className="group block rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/60 p-4 transition hover:border-[var(--accent)]/60"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <h4 className="font-medium text-[var(--text-primary)] transition group-hover:text-[var(--accent-text)]">
              {b.chapterTitle}
            </h4>
            <ExternalLink
              size={14}
              className="mt-1 shrink-0 text-[var(--text-subtle)] transition group-hover:text-[var(--accent-text)]"
            />
          </div>

          {b.snippets.length > 0 && (
            <div className="space-y-1.5">
              {b.snippets.map((snippet, i) => (
                <p
                  key={i}
                  className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]"
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
