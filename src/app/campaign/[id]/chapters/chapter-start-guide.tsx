'use client'

import { useState } from 'react'
import { BookOpen, ArrowRight } from 'lucide-react'
import { useT } from '@/lib/i18n'
import CreateChapterModal from './create-chapter-modal'

export default function ChapterStartGuide({ campaignId }: { campaignId: string }) {
  const t = useT()
  const [title, setTitle] = useState<string | null>(null)
  return (
    <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-7">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
        <BookOpen size={20} />
        {t('prep.chapterStart')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
        {t('prep.chapterHint')}
      </p>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setTitle(t('prep.chapter' + index))}
            className="min-h-32 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-4 text-left transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <span className="flex items-center justify-between gap-2 font-semibold text-[var(--accent-text)]">
              {t('prep.chapter' + index)}
              <ArrowRight size={16} className="shrink-0" />
            </span>
            <span className="mt-3 block text-sm leading-6 text-[var(--text-secondary)]">
              {t('prep.chapterHint' + index)}
            </span>
          </button>
        ))}
      </div>
      {title !== null && (
        <CreateChapterModal
          campaignId={campaignId}
          initialTitle={title}
          onClose={() => setTitle(null)}
        />
      )}
    </section>
  )
}
