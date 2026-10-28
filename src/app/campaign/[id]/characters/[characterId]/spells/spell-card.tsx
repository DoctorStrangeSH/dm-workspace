'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Dices, Trash2, Check } from 'lucide-react'
import { updateSpell, removeSpell } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { spellSchoolLabel } from '@/lib/i18n/labels'
import { cn } from '@/lib/utils'
import type { CharacterSpell } from '@/lib/types'

interface Props {
  spell: CharacterSpell
  characterId: string
  campaignId: string
  canEdit: boolean
  onRoll?: (spell: CharacterSpell) => void
}

export default function SpellCard({ spell, characterId, campaignId, canEdit, onRoll }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const spellId = spell.id

  const togglePrepared = () => {
    if (!spellId) return
    startTransition(async () => {
      const res = await updateSpell(characterId, campaignId, spellId, {
        prepared: !spell.prepared,
      })
      if ('error' in res) {
        toast.error(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    if (!spellId) return
    startTransition(async () => {
      const res = await removeSpell(characterId, campaignId, spellId)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(t('spells.toast.deleted'))
        setShowDeleteConfirm(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] transition-colors duration-200 hover:border-[var(--accent)]/40 motion-reduce:transition-none">
        <div className="flex items-center gap-2 p-3 transition-colors hover:bg-[var(--bg-hover)]">
          {canEdit && spell.level > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePrepared()
              }}
              type="button"
              disabled={isPending}
              aria-label={`${spell.name}: ${spell.prepared ? t('spells.prepared') : t('spells.notPrepared')}`}
              aria-pressed={!!spell.prepared}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
                spell.prepared
                  ? 'border-[var(--accent)] bg-[var(--accent)]'
                  : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
              )}
              title={spell.prepared ? t('spells.prepared') : t('spells.notPrepared')}
            >
              {spell.prepared && <Check size={10} className="text-white" />}
            </button>
          )}

          <button type="button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-label={`${spell.name}: ${isOpen ? t('common.close') : spell.name}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
            <ChevronDown size={14} aria-hidden="true" className={cn('shrink-0 text-[var(--text-subtle)] transition-transform duration-200 motion-reduce:transition-none', isOpen && 'rotate-180')} />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="min-w-0 break-words font-medium text-[var(--text-primary)]">{spell.name}</span>
              {spell.ritual && (
                <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--accent-text)]">
                  {t('spells.ritual')}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {spell.school && spellSchoolLabel(lang, spell.school)}
              {spell.castingTime && ` · ${spell.castingTime}`}
            </div>
          </div>

          </button>

          {onRoll && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRoll(spell)
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]" aria-label={t('spells.roll')}
              title={t('spells.roll')}
            >
              <Dices size={18} className="text-[var(--text-muted)]" />
            </button>
          )}

          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              disabled={isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--danger-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-50" aria-label={t('common.delete')}
              title={t('common.delete')}
            >
              <Trash2 size={18} className="text-[var(--danger)]" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="border-t border-[var(--border-default)] bg-[var(--bg-app)]/40 px-3 pb-3">
            <div className="grid grid-cols-2 gap-2 py-3 text-xs">
              {spell.range && (
                <div>
                  <span className="text-[var(--text-subtle)]">{t('spells.range')}:</span>{' '}
                  <span className="text-[var(--text-secondary)]">{spell.range}</span>
                </div>
              )}
              {spell.components && (
                <div>
                  <span className="text-[var(--text-subtle)]">{t('spells.components')}:</span>{' '}
                  <span className="text-[var(--text-secondary)]">{spell.components}</span>
                </div>
              )}
              {spell.duration && (
                <div>
                  <span className="text-[var(--text-subtle)]">{t('spells.duration')}:</span>{' '}
                  <span className="text-[var(--text-secondary)]">{spell.duration}</span>
                </div>
              )}
            </div>

            {spell.description && (
              <div className="pb-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">
                {spell.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => !isPending && setShowDeleteConfirm(false)}
        title={t('spells.deleteConfirm.title')}
        description={t('spells.deleteConfirm.description', { name: spell.name })}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('spells.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </>
  )
}
