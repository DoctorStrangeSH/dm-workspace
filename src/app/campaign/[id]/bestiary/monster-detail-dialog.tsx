'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Loader2 } from 'lucide-react'
import { addMonsterToCampaign } from '@/lib/actions/bestiary'
import { useToast } from '@/components/toast/toast-provider'
import type { SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  monster: SrdMonster
  campaignId: string
  canEdit: boolean
  onClose: () => void
}

function formatModifier(score: number | undefined): string {
  const mod = Math.floor(((score ?? 10) - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function MonsterDetailDialog({ monster, campaignId, canEdit, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const data = monster.data

  const handleAdd = () => {
    startTransition(async () => {
      const res = await addMonsterToCampaign(monster.key, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Монстр добавлен в кампанию')
        router.refresh()
        onClose()
      }
    })
  }

  const abilities = [
    { label: 'СИЛ', score: data.abilities?.str },
    { label: 'ЛОВ', score: data.abilities?.dex },
    { label: 'ТЕЛ', score: data.abilities?.con },
    { label: 'ИНТ', score: data.abilities?.int },
    { label: 'МДР', score: data.abilities?.wis },
    { label: 'ХАР', score: data.abilities?.cha },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">{monster.name_ru ?? monster.name}</h2>
            <p className="mt-0.5 text-sm text-slate-400 italic">
              {data.size} {data.type}, {data.alignment || '—'}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-1 transition hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          <div className="space-y-1 rounded-lg bg-slate-950/50 p-3">
            <div>
              <span className="text-slate-500">AC:</span>{' '}
              <span className="text-slate-200">{data.ac ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">HP:</span>{' '}
              <span className="text-slate-200">{data.hp ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Скорость:</span>{' '}
              <span className="text-slate-200">{data.speed ?? '—'} футов</span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {abilities.map((a) => (
              <div
                key={a.label}
                className="rounded border border-slate-800 bg-slate-950 p-2 text-center"
              >
                <div className="text-[10px] text-slate-500 uppercase">{a.label}</div>
                <div className="text-base font-bold">{a.score ?? 10}</div>
                <div className="text-[10px] text-slate-500">{formatModifier(a.score)}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <strong className="text-amber-300">CR:</strong>{' '}
                <span className="text-slate-200">{data.cr ?? '—'}</span>
              </div>
              <div>
                <strong className="text-amber-300">XP:</strong>{' '}
                <span className="text-slate-200">{data.xp ?? '—'}</span>
              </div>
            </div>
          </div>

          {data.description && (
            <div>
              <h3 className="mb-2 font-semibold text-slate-300">Описание</h3>
              <div className="text-xs whitespace-pre-wrap text-slate-400">{data.description}</div>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex justify-end gap-2 border-t border-slate-800 p-4">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm transition hover:bg-slate-700"
            >
              Закрыть
            </button>
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Добавляем...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Добавить в кампанию
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
