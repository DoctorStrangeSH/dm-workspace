'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, ChevronRight, X, Dices } from 'lucide-react'
import { nextTurn, endCombat, rollInitiativeForToken, damageToken } from '@/lib/actions/combat'
import { useToast } from '@/components/toast/toast-provider'
import { useRealtimeInitiative } from '@/lib/hooks/use-realtime-initiative'
import { cn } from '@/lib/utils'
import { Button, IconButton, Dialog } from '@/components/ui'
import type { InitiativeEntryWithToken } from '@/lib/types'

interface Props {
  sceneId: string
  initialInitiative: InitiativeEntryWithToken[]
  isDm: boolean
  onClose: () => void
}

export default function InitiativePanel({ sceneId, initialInitiative, isDm, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedEntry, setSelectedEntry] = useState<InitiativeEntryWithToken | null>(null)

  const entries = useRealtimeInitiative({
    sceneId,
    initialInitiative,
  })

  const currentEntry = entries.find((e) => e.is_current)

  const handleNextTurn = () => {
    startTransition(async () => {
      const res = await nextTurn(sceneId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else router.refresh()
    })
  }

  const handleEndCombat = () => {
    if (!confirm('Завершить бой?')) return
    startTransition(async () => {
      const res = await endCombat(sceneId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Бой завершён')
        router.refresh()
        onClose()
      }
    })
  }

  const handleRoll = (entry: InitiativeEntryWithToken) => {
    startTransition(async () => {
      const res = await rollInitiativeForToken(entry.id, sceneId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
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
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else router.refresh()
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-2xl sm:w-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-[var(--danger)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">Бой</h2>
        </div>
        <IconButton variant="ghost" size="sm" label="Закрыть" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>

      {/* Текущий ход */}
      {currentEntry && (
        <div className="border-b border-[var(--danger)]/40 bg-[var(--danger-subtle)] p-3">
          <div className="mb-1 text-xs tracking-wider text-[var(--danger-text)] uppercase">
            Сейчас
          </div>
          <div className="font-semibold text-[var(--text-primary)]">{currentEntry.token.name}</div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleNextTurn}
            disabled={isPending}
            icon={<ChevronRight size={14} />}
            iconPosition="right"
            className="mt-2 w-full"
          >
            Следующий ход
          </Button>
        </div>
      )}

      {/* Список */}
      <div className="flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Нет инициативы</p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => {
              const isCurrent = entry.is_current
              const hpPercent =
                entry.token.hp_current !== null && entry.token.hp_max !== null
                  ? (entry.token.hp_current / entry.token.hp_max) * 100
                  : null

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors',
                    isCurrent
                      ? 'border border-[var(--danger)]/30 bg-[var(--danger-subtle)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  )}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="w-4 text-xs text-[var(--text-muted)]">{entry.initiative}</div>
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm"
                    style={{
                      borderColor: entry.token.color,
                      backgroundColor: `${entry.token.color}33`,
                    }}
                  >
                    ⚔️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {entry.token.name}
                    </div>
                    {entry.token.hp_current !== null && entry.token.hp_max !== null && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <div className="h-1 flex-1 overflow-hidden rounded bg-[var(--bg-app)]">
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
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {entry.token.hp_current}/{entry.token.hp_max}
                        </span>
                      </div>
                    )}
                  </div>
                  {entry.initiative === 0 && isDm && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      label="Бросок инициативы"
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
              )
            })}
          </div>
        )}
      </div>

      {/* Футер */}
      <div className="border-t border-[var(--border-default)] p-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleEndCombat}
          disabled={isPending}
          className="w-full text-[var(--danger-text)]"
        >
          Завершить бой
        </Button>
      </div>

      {/* Меню урона */}
      {selectedEntry && (
        <Dialog
          open={true}
          onClose={() => setSelectedEntry(null)}
          title={selectedEntry.token.name}
          size="sm"
        >
          {selectedEntry.token.hp_current !== null && selectedEntry.token.hp_max !== null && (
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
                    width: `${(selectedEntry.token.hp_current / selectedEntry.token.hp_max) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1">
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
          </div>
        </Dialog>
      )}
    </aside>
  )
}
