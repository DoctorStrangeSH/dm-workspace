'use client'

import { useState } from 'react'
import { Plus, Trash2, ListChecks } from 'lucide-react'
import { useT } from '@/lib/i18n'
import {
  MAX_QUEST_OBJECTIVES,
  MAX_OBJECTIVE_TEXT,
  readQuestObjectives,
} from '@/lib/quest-objectives'
import { Button } from '@/components/ui/button'
import QuestProgress from '../quest-progress'

export default function QuestObjectives({
  value,
  isDm,
  onChange,
}: {
  value: unknown
  isDm: boolean
  onChange: (value: unknown) => void
}) {
  const t = useT()
  const [draft, setDraft] = useState('')
  const objectives = readQuestObjectives(value)
  const completed = objectives?.filter((item) => item.done).length ?? 0
  return (
    <section
      aria-label={t('questObjectives.title')}
      className="mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <ListChecks size={20} aria-hidden="true" />
          {t('questObjectives.title')}
        </h3>
        {objectives && objectives.length > 0 && (
          <span
            className="rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-sm font-medium text-[var(--text-primary)]"
            aria-live="polite"
          >
            {t('questObjectives.progress', { done: completed, total: objectives.length })}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {t(isDm ? 'questObjectives.hint' : 'questObjectives.playerHint')}
      </p>
      {objectives === null ? (
        <p role="alert" className="mt-3 text-sm text-[var(--warning-text)]">
          {t('questObjectives.invalid')}
        </p>
      ) : (
        <>
          {objectives.length > 0 ? (
            <>
              <div className="mt-4">
                <QuestProgress
                  label={t('questObjectives.title')}
                  done={completed}
                  total={objectives.length}
                />
              </div>
              <ul className="mt-3 space-y-2">
                {objectives.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] p-2"
                  >
                    <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 px-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={!isDm}
                        onChange={(e) =>
                          onChange(
                            objectives.map((goal) =>
                              goal.id === item.id ? { ...goal, done: e.target.checked } : goal
                            )
                          )
                        }
                        className="h-5 w-5 shrink-0 accent-[var(--accent)]"
                      />
                      <span
                        className={`min-w-0 text-sm break-words ${item.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}
                      >
                        {item.text}
                      </span>
                    </label>
                    {isDm && (
                      <button
                        type="button"
                        aria-label={t('questObjectives.remove', { number: index + 1 })}
                        onClick={() => onChange(objectives.filter((goal) => goal.id !== item.id))}
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--danger-subtle)] hover:text-[var(--danger-text)] focus-visible:outline-2"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-[var(--border-default)] p-4 text-sm text-[var(--text-muted)]">
              {t('questObjectives.empty')}
            </p>
          )}
          {isDm && (
            <div className="mt-4">
              <label
                htmlFor="new-quest-objective"
                className="mb-2 block text-sm text-[var(--text-secondary)]"
              >
                {t('questObjectives.new')}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="new-quest-objective"
                  value={draft}
                  maxLength={MAX_OBJECTIVE_TEXT}
                  disabled={objectives.length >= MAX_QUEST_OBJECTIVES}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (draft.trim() && objectives.length < MAX_QUEST_OBJECTIVES) {
                        onChange([
                          ...objectives,
                          { id: crypto.randomUUID(), text: draft.trim(), done: false },
                        ])
                        setDraft('')
                      }
                    }
                  }}
                  placeholder={t('questObjectives.placeholder')}
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] focus:outline-2"
                />
                <Button
                  type="button"
                  icon={<Plus size={16} />}
                  disabled={!draft.trim() || objectives.length >= MAX_QUEST_OBJECTIVES}
                  onClick={() => {
                    onChange([
                      ...objectives,
                      { id: crypto.randomUUID(), text: draft.trim(), done: false },
                    ])
                    setDraft('')
                  }}
                >
                  {t('questObjectives.add')}
                </Button>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {t('questObjectives.limit', { count: MAX_QUEST_OBJECTIVES })}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
