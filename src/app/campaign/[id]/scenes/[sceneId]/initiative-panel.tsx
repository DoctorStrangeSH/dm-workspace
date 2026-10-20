'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, ChevronRight, X, Dices } from 'lucide-react'
import { nextTurn, endCombat, rollInitiativeForToken, damageToken } from '@/lib/actions/combat'
import { useToast } from '@/components/toast/toast-provider'
import { useRealtimeInitiative } from '@/lib/hooks/use-realtime-initiative'
import { cn } from '@/lib/utils'
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

  // CHANGES: убран Math.random() — бросок теперь на сервере (в rollInitiativeForToken)
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
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-slate-800 bg-slate-900 shadow-2xl sm:w-[340px]">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-red-400" />
          <h2 className="font-semibold">Бой</h2>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      {currentEntry && (
        <div className="border-b border-red-900/40 bg-red-950/30 p-3">
          <div className="mb-1 text-xs tracking-wider text-red-400 uppercase">Сейчас</div>
          <div className="font-semibold text-white">{currentEntry.token.name}</div>
          <button
            onClick={handleNextTurn}
            disabled={isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            Следующий ход
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Нет инициативы</p>
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
                    'flex cursor-pointer items-center gap-2 rounded-lg p-2 transition',
                    isCurrent ? 'border border-red-900/50 bg-red-950/40' : 'hover:bg-slate-800/60'
                  )}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="w-4 text-xs text-slate-500">{entry.initiative}</div>
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
                    <div className="truncate text-sm font-medium">{entry.token.name}</div>
                    {entry.token.hp_current !== null && entry.token.hp_max !== null && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <div className="h-1 flex-1 overflow-hidden rounded bg-slate-950">
                          <div
                            className={cn(
                              'h-full transition-all duration-300',
                              (hpPercent ?? 0) > 50
                                ? 'bg-green-500'
                                : (hpPercent ?? 0) > 25
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            )}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {entry.token.hp_current}/{entry.token.hp_max}
                        </span>
                      </div>
                    )}
                  </div>
                  {entry.initiative === 0 && isDm && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRoll(entry)
                      }}
                      disabled={isPending}
                      className="rounded p-1 transition hover:bg-slate-700 disabled:opacity-50"
                      title="Бросок инициативы"
                    >
                      <Dices size={14} className="text-slate-400" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-800 p-3">
        <button
          onClick={handleEndCombat}
          disabled={isPending}
          className="w-full rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-red-300 transition hover:bg-slate-700 disabled:opacity-50"
        >
          Завершить бой
        </button>
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{selectedEntry.token.name}</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="rounded p-1 hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {selectedEntry.token.hp_current !== null && selectedEntry.token.hp_max !== null && (
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">HP</span>
                  <span>
                    {selectedEntry.token.hp_current}/{selectedEntry.token.hp_max}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-950">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{
                      width: `${(selectedEntry.token.hp_current / selectedEntry.token.hp_max) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-1">
              {[-5, -1, +1, +5].map((delta) => (
                <button
                  key={delta}
                  onClick={() =>
                    handleDamage(selectedEntry, Math.abs(delta), delta < 0 ? 'damage' : 'heal')
                  }
                  disabled={isPending}
                  className={cn(
                    'rounded px-2 py-2 text-sm font-medium transition disabled:opacity-50',
                    delta < 0
                      ? 'border border-red-900/50 bg-red-950/40 text-red-300 hover:bg-red-950/60'
                      : 'border border-green-900/50 bg-green-950/40 text-green-300 hover:bg-green-950/60'
                  )}
                >
                  {delta > 0 ? '+' : ''}
                  {delta}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
