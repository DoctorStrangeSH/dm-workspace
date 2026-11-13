'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Star, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { updateCharacter } from '@/lib/actions/characters'
import { characterFeaturePatch, type FeatureDraft } from '@/lib/dnd/character-workspace'
import type { Character, CharacterData } from '@/lib/types'

export default function FeaturesTab({
  character,
  campaignId,
  canEdit,
}: {
  character: Character
  campaignId: string
  canEdit: boolean
}) {
  const t = useT()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [original, setOriginal] = useState<CharacterData>(character.data_json)
  const [draft, setDraft] = useState<FeatureDraft>({ features: [], traits: [], notes: '' })
  const [attacks, setAttacks] = useState<
    Array<{ name: string; bonus: string; damage: string; notes: string; damageType?: string }>
  >([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const guard = useRef(false)
  const [saved, setSaved] = useState(false)
  const data = character.data_json
  const safeList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  function openEditor() {
    setOriginal(structuredClone(data))
    setDraft({
      features: safeList(data.features),
      traits: safeList(data.traits),
      notes: typeof data.notes === 'string' ? data.notes : '',
    })
    setAttacks(
      (data.attacks ?? []).map((attack) => ({
        ...attack,
        bonus: String(attack.bonus),
        notes: attack.notes ?? '',
      }))
    )
    setEditing(true)
    setError(null)
    setSaved(false)
  }
  async function save() {
    if (!canEdit || guard.current) return
    const patch = characterFeaturePatch(original, {
      ...draft,
      attacks: attacks.map((attack) => ({
        ...attack,
        bonus: /^[+-]?\d+$/.test(attack.bonus) ? Number(attack.bonus) : NaN,
      })),
    })
    if (!patch) {
      setError(t('sheet.features.invalid'))
      return
    }
    if (JSON.stringify(data) !== JSON.stringify(original)) {
      setError(t('sheet.features.conflict'))
      return
    }
    guard.current = true
    setPending(true)
    setError(null)
    try {
      const result = await updateCharacter(character.id, campaignId, patch)
      if ('error' in result) setError(result.error ?? t('common.error'))
      else {
        setEditing(false)
        setSaved(true)
        router.refresh()
      }
    } catch {
      setError(t('sheet.features.uncertain'))
    } finally {
      guard.current = false
      setPending(false)
    }
  }
  return (
    <section className="space-y-4" aria-label={t('characters.features.title')}>
      <header className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
          <Star size={20} aria-hidden="true" />
          {t('characters.features.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {t('sheet.features.hint')}
        </p>
        {canEdit && !editing && (
          <Button className="mt-3 min-h-11" icon={<Pencil size={16} />} onClick={openEditor}>
            {t('sheet.features.edit')}
          </Button>
        )}
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[var(--danger)] p-3 text-sm text-[var(--danger-text)]"
        >
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-[var(--success-text)]">
          {t('sheet.features.saved')}
        </p>
      )}
      {editing && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
            {t('sheet.features.attacks')}
          </h3>
          <p className="mb-3 text-xs leading-5 text-[var(--text-muted)]">
            {t('sheet.features.attacksHint')}
          </p>
          <div className="space-y-3">
            {attacks.map((attack, index) => (
              <fieldset
                key={index}
                disabled={pending}
                className="min-w-0 rounded-xl border border-[var(--border-default)] p-3"
              >
                <legend className="px-1 text-xs text-[var(--text-muted)]">
                  {t('sheet.attack')} {index + 1}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['name', 'bonus', 'damage', 'notes'] as const).map((field) => (
                    <label key={field} className="min-w-0 text-xs text-[var(--text-muted)]">
                      {t('sheet.features.attack.' + field)}
                      <input
                        type="text"
                        value={attack[field]}
                        maxLength={
                          field === 'name'
                            ? 150
                            : field === 'notes'
                              ? 2000
                              : field === 'bonus'
                                ? 5
                                : 100
                        }
                        onChange={(event) =>
                          setAttacks((previous) =>
                            previous.map((value, i) =>
                              i === index ? { ...value, [field]: event.target.value } : value
                            )
                          )
                        }
                        className="mt-1 min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-2 text-sm text-[var(--text-primary)]"
                      />
                    </label>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="mt-2 min-h-11"
                  onClick={() => setAttacks((previous) => previous.filter((_, i) => i !== index))}
                >
                  {t('common.delete')} {index + 1}
                </Button>
              </fieldset>
            ))}
          </div>
          <Button
            variant="secondary"
            className="mt-3 min-h-11"
            disabled={pending || attacks.length >= 30}
            icon={<Plus size={16} />}
            onClick={() =>
              setAttacks((previous) => [
                ...previous,
                { name: '', bonus: '0', damage: '1d6', notes: '' },
              ])
            }
          >
            {t('sheet.features.addAttack')}
          </Button>
        </div>
      )}
      {(['features', 'traits'] as const).map((kind) => (
        <div
          key={kind}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5"
        >
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">
            {t('sheet.features.' + kind)}
          </h3>
          {(editing ? draft[kind] : safeList(data[kind])).length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">{t('sheet.features.empty')}</p>
          )}
          <ul className="space-y-3">
            {(editing ? draft[kind] : safeList(data[kind])).map((text, index) => (
              <li
                key={index}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-3"
              >
                {editing ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      aria-label={`${t('sheet.features.' + kind)} ${index + 1}`}
                      value={text}
                      maxLength={2000}
                      rows={3}
                      disabled={pending}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          [kind]: previous[kind].map((value, i) =>
                            i === index ? event.target.value : value
                          ),
                        }))
                      }
                      className="min-h-24 min-w-0 flex-1 resize-y rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-primary)]"
                    />
                    <button
                      type="button"
                      aria-label={`${t('common.delete')}: ${t('sheet.features.' + kind)} ${index + 1}`}
                      disabled={pending}
                      onClick={() =>
                        setDraft((previous) => ({
                          ...previous,
                          [kind]: previous[kind].filter((_, i) => i !== index),
                        }))
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--danger-text)]"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
                    {text}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <Button
              variant="secondary"
              className="mt-3 min-h-11"
              disabled={pending || draft[kind].length >= 50}
              icon={<Plus size={16} />}
              onClick={() =>
                setDraft((previous) => ({ ...previous, [kind]: [...previous[kind], ''] }))
              }
            >
              {t('sheet.features.add')}
            </Button>
          )}
        </div>
      ))}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <NotebookPen size={18} aria-hidden="true" />
          {t('sheet.features.notes')}
        </h3>
        {editing ? (
          <textarea
            aria-label={t('sheet.features.notes')}
            value={draft.notes}
            maxLength={12000}
            rows={6}
            disabled={pending}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, notes: event.target.value }))
            }
            className="w-full resize-y rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)]"
          />
        ) : (
          <p className="text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
            {typeof data.notes === 'string' && data.notes ? data.notes : t('sheet.features.empty')}
          </p>
        )}
      </div>
      {editing && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} loading={pending} className="min-h-11">
            {t('common.save')}
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
            className="min-h-11"
          >
            {t('common.cancel')}
          </Button>
          <p className="w-full text-xs text-[var(--text-muted)]">{t('sheet.features.unsaved')}</p>
        </div>
      )}
    </section>
  )
}
