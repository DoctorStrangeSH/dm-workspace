'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, ChevronRight, X, Dices, Shield, Minus, Plus, HeartPulse } from 'lucide-react'
import { nextTurn, endCombat, rollInitiativeForToken, damageToken } from '@/lib/actions/combat'
import { useToast } from '@/components/toast/toast-provider'
import { useRealtimeInitiative } from '@/lib/hooks/use-realtime-initiative'
import { cn } from '@/lib/utils'
import { Button, IconButton, Dialog, Badge } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { InitiativeEntryWithToken } from '@/lib/types'

interface Props {
  sceneId: string
  initialInitiative: InitiativeEntryWithToken[]
  isDm: boolean
  onClose: () => void
}

export default function InitiativePanel({ sceneId, initialInitiative, isDm, onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedEntry, setSelectedEntry] = useState<InitiativeEntryWithToken | null>(null)
  const [showEndCombatConfirm, setShowEndCombatConfirm] = useState(false)

  const entries = useRealtimeInitiative({
    sceneId,
    initialInitiative,
  })

  const currentEntry = entries.find((e) => e.is_current)

  const handleNextTurn = () => {
    startTransition(async () => {
      const res = await nextTurn(sceneId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  const doEndCombat = () => {
    startTransition(async () => {
      const res = await endCombat(sceneId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('scenes.toast.combatEnded'))
        router.refresh()
        onClose()
      }
      setShowEndCombatConfirm(false)
    })
  }

  const handleRoll = (entry: InitiativeEntryWithToken) => {
    startTransition(async () => {
      const res = await rollInitiativeForToken(entry.id, sceneId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.info(`${entry.token.name}: ${res.total}`, {
          description: `[${res.roll}] ${res.dexMod >= 0 ? '+' : ''}${res.dexMod} (DEX)`,
        })
        router.refresh()
      }
    })
  }

  const handleDamage = (
    entry: InitiativeEntryWithToken,
    amount: number,
    type: 'damage' | 'heal'
  ) => {
    startTransition(async () => {
      const res = await damageToken(entry.token_id, sceneId, amount, type)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else router.refresh()
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-2xl sm:w-[380px]">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-[var(--danger)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">
            {t('scenes.initiative.title')}
          </h2>
          <span className="text-xs text-[var(--text-muted)]">({entries.length})</span>
        </div>
        <IconButton variant="ghost" size="sm" label={t('common.close')} onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>

      {currentEntry && (
        <div className="border-b border-[var(--danger)]/40 bg-[var(--danger-subtle)] p-3">
          <div className="mb-1 text-xs tracking-wider text-[var(--danger-text)] uppercase">
            {t('scenes.initiative.now')}
          </div>
          <div className="font-semibold text-[var(--text-primary)]">{currentEntry.token.name}</div>
          {isDm && <Button
            variant="danger"
            size="sm"
            onClick={handleNextTurn}
            disabled={isPending}
            icon={<ChevronRight size={14} />}
            iconPosition="right"
            className="mt-2 w-full"
          >
            {t('scenes.initiative.nextTurn')}
          </Button>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            {t('scenes.initiative.empty')}
          </p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => {
              const isCurrent = entry.is_current
              const hasHP = entry.token.hp_current !== null && entry.token.hp_max !== null && Number.isFinite(entry.token.hp_current) && Number.isFinite(entry.token.hp_max) && entry.token.hp_max > 0
              const hpPercent = hasHP ? Math.max(0, Math.min(100, (entry.token.hp_current! / entry.token.hp_max!) * 100)) : null
              const ac = entry.token.ac ?? null
              const conditions = Array.isArray(entry.token.conditions) ? entry.token.conditions : []

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'relative rounded-xl border p-3 transition-colors',
                    isCurrent
                      ? 'border-[var(--danger)]/50 bg-[var(--danger-subtle)] shadow-[inset_3px_0_0_var(--danger)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCurrent && <span className="sr-only">{t('scenes.initiative.now')}</span>}
                    <div className="w-5 text-center text-xs font-medium text-[var(--text-muted)]">
                      {entry.initiative}
                    </div>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm"
                      style={{
                        borderColor: entry.token.color,
                        backgroundColor: `${entry.token.color}33`,
                      }}
                    >
                      ⚔️
                    </div>
                    <button type="button" onClick={() => setSelectedEntry(entry)} aria-label={`${entry.token.name}: ${entry.initiative}`} className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
                      <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{entry.token.name}</span>
                      {isCurrent && <span className="text-[10px] font-semibold text-[var(--danger-text)]">{t('scenes.initiative.now')}</span>}
                    </button>
                    {ac !== null && (
                      <Badge variant="neutral" size="sm" icon={<Shield size={10} />}>
                        {ac}
                      </Badge>
                    )}
                    {entry.initiative === 0 && isDm && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        label={t('scenes.initiative.roll')}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRoll(entry)
                        }}
                        disabled={isPending}
                      >
                        <Dices size={14} />
                      </IconButton>
                    )}
                  </div>

                  {hasHP && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 sm:pl-7">
                      <HeartPulse size={12} aria-hidden="true" className="text-[var(--danger-text)]" />
                      <div className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-[var(--bg-app)]">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            (hpPercent ?? 0) > 50
                              ? 'bg-[var(--success)]'
                              : (hpPercent ?? 0) > 25
                                ? 'bg-[var(--warning)]'
                                : 'bg-[var(--danger)]'
                          )}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] text-[var(--text-muted)] tabular-nums">
                        {entry.token.hp_current}/{entry.token.hp_max}
                      </span>
                      {isDm && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDamage(entry, 5, 'damage')
                            }}
                            disabled={isPending}
                            className="min-h-8 rounded-md px-2 py-1 text-xs font-medium text-[var(--danger-text)] transition hover:bg-[var(--danger-subtle)] disabled:opacity-50"
                            title={t('scenes.hp.minus', { n: 5 })}
                          >
                            <Minus size={10} className="inline" />5
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDamage(entry, 1, 'damage')
                            }}
                            disabled={isPending}
                            className="rounded px-1 py-0.5 text-[10px] font-medium text-[var(--danger-text)] transition hover:bg-[var(--danger-subtle)] disabled:opacity-50"
                            title={t('scenes.hp.minus', { n: 1 })}
                          >
                            <Minus size={10} className="inline" />1
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDamage(entry, 1, 'heal')
                            }}
                            disabled={isPending}
                            className="rounded px-1 py-0.5 text-[10px] font-medium text-[var(--success-text)] transition hover:bg-[var(--success-subtle)] disabled:opacity-50"
                            title={t('scenes.hp.plus', { n: 1 })}
                          >
                            <Plus size={10} className="inline" />1
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDamage(entry, 5, 'heal')
                            }}
                            disabled={isPending}
                            className="rounded px-1 py-0.5 text-[10px] font-medium text-[var(--success-text)] transition hover:bg-[var(--success-subtle)] disabled:opacity-50"
                            title={t('scenes.hp.plus', { n: 5 })}
                          >
                            <Plus size={10} className="inline" />5
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {conditions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 sm:pl-7">
                      {conditions.map((c, i) => (
                        <span
                          key={i}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[10px]"
                          title={c.name}
                        >
                          {c.icon ?? '●'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {isDm && <div className="border-t border-[var(--border-default)] p-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowEndCombatConfirm(true)}
          disabled={isPending}
          className="w-full text-[var(--danger-text)]"
        >
          {t('scenes.initiative.endCombat')}
        </Button>
      </div>}

      {selectedEntry && (
        <Dialog
          open={true}
          onClose={() => setSelectedEntry(null)}
          title={selectedEntry.token.name}
          size="sm"
        >
          {selectedEntry.token.hp_current !== null && selectedEntry.token.hp_max !== null && selectedEntry.token.hp_max > 0 && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">HP</span>
                <span className="text-[var(--text-primary)]">
                  {selectedEntry.token.hp_current}/{selectedEntry.token.hp_max}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-[var(--bg-app)]">
                <div
                  className="h-full bg-[var(--danger)] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, (selectedEntry.token.hp_current! / (selectedEntry.token.hp_max ?? 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {isDm && <div className="grid grid-cols-4 gap-1">
            {[-5, -1, +1, +5].map((delta) => (
              <Button
                key={delta}
                variant={delta < 0 ? 'danger' : 'primary'}
                size="md"
                onClick={() =>
                  handleDamage(selectedEntry, Math.abs(delta), delta < 0 ? 'damage' : 'heal')
                }
                disabled={isPending}
              >
                {delta > 0 ? '+' : ''}
                {delta}
              </Button>
            ))}
          </div>}
        </Dialog>
      )}

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={showEndCombatConfirm}
        onClose={() => !isPending && setShowEndCombatConfirm(false)}
        title={t('scenes.initiative.endCombatConfirm.title')}
        description={t('scenes.initiative.endCombatConfirm.description')}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowEndCombatConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={doEndCombat} loading={isPending}>
              {t('scenes.initiative.endCombatConfirm.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          {t('scenes.initiative.endCombatConfirm.cannotUndo')}
        </p>
      </Dialog>
    </aside>
  )
}
