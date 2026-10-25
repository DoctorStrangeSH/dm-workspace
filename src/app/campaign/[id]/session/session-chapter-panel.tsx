'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react'
import { Dropdown } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { Chapter } from '@/lib/types'

interface Props {
  campaignId: string
  chapters: Chapter[]
  activeChapter: Chapter | null
}

export function SessionChapterPanel({ campaignId, chapters, activeChapter }: Props) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()

  const setChapter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('chapter', id)
    router.push(`/campaign/${campaignId}/session?${params.toString()}`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] p-2">
        <BookOpen size={14} className="shrink-0 text-[var(--accent-text)]" />
        <div className="min-w-0 flex-1">
          <Dropdown
            align="left"
            trigger={
              <button className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]">
                <span className="truncate text-[var(--text-primary)]">
                  {activeChapter?.title ?? t('session.noChapter')}
                </span>
                <ChevronDown size={12} className="shrink-0 text-[var(--text-muted)]" />
              </button>
            }
            items={chapters.map((c) => ({
              label: c.title,
              onClick: () => setChapter(c.id),
            }))}
          />
        </div>
        {activeChapter && (
          <Link
            href={`/campaign/${campaignId}/chapters/${activeChapter.id}`}
            target="_blank"
            className="shrink-0 rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title={t('session.openChapter')}
          >
            <ExternalLink size={12} />
          </Link>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {activeChapter ? (
          <div className="text-sm whitespace-pre-wrap text-[var(--text-secondary)]">
            {activeChapter.content_md || t('session.emptyChapter')}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">{t('session.selectChapter')}</p>
        )}
      </div>
    </div>
  )
}
