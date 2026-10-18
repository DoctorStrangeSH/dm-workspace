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

export default function MonsterDetailDialog({
  monster,
  campaignId,
  canEdit,
  onClose,
}: Props) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">
              {monster.name_ru ?? monster.name}
            </h2>
            <p className="text-sm text-slate-400 italic mt-0.5">
              {data.size} {data.type}, {data.alignment || '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          <div className="space-y-1 p-3 bg-slate-950/50 rounded-lg">
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
                className="text-center bg-slate-950 border border-slate-800 rounded p-2"
              >
                <div className="text-[10px] text-slate-500 uppercase">
                  {a.label}
                </div>
                <div className="text-base font-bold">{a.score ?? 10}</div>
                <div className="text-[10px] text-slate-500">
                  {formatModifier(a.score)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg">
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
              <h3 className="font-semibold text-slate-300 mb-2">Описание</h3>
              <div className="text-slate-400 whitespace-pre-wrap text-xs">
                {data.description}
              </div>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-sm"
            >
              Закрыть
            </button>
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition text-sm font-medium disabled:opacity-50"
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