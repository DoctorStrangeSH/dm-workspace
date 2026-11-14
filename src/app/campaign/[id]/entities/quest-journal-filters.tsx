'use client'

import { ScrollText } from 'lucide-react'
import { useT } from '@/lib/i18n'
import {
  QUEST_STATUSES,
  questStatus,
  type EntityLibraryCard,
  type QuestStatus,
} from '@/lib/quest-journal'
import { cn } from '@/lib/utils'

export default function QuestJournalFilters({
  quests,
  selected,
  onChange,
}: {
  quests: EntityLibraryCard[]
  selected: QuestStatus | 'all'
  onChange: (value: QuestStatus | 'all') => void
}) {
  const t = useT()
  return (
    <section
      aria-label={t('questJournal.title')}
      className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-4"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
        <ScrollText size={20} aria-hidden="true" />
        {t('questJournal.title')}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{t('questJournal.hint')}</p>
      <div
        role="group"
        aria-label={t('questJournal.filter')}
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {(['all', ...QUEST_STATUSES] as const).map((status) => {
          const count =
            status === 'all'
              ? quests.length
              : quests.filter((quest) => questStatus(quest.quest?.status) === status).length
          return (
            <button
              type="button"
              key={status}
              aria-pressed={selected === status}
              onClick={() => onChange(status)}
              className={cn(
                'min-h-20 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                selected === status
                  ? 'border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
              )}
            >
              <span className="block text-xl font-semibold tabular-nums">{count}</span>
              <span className="mt-1 block text-xs">{t(`questJournal.status.${status}`)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">{t('questJournal.unsetHint')}</p>
    </section>
  )
}
