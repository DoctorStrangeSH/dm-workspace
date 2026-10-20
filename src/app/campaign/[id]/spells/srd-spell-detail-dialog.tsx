'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Loader2 } from 'lucide-react'
import { addSrdSpellToCharacter } from '@/lib/actions/add-spell-to-character'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import { useToast } from '@/components/toast/toast-provider'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  campaignId: string
  characters: Array<{ id: string; name: string }>
  onClose: () => void
}

export default function SrdSpellDetailDialog({ spell, campaignId, characters, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedChar, setSelectedChar] = useState<string | null>(characters[0]?.id ?? null)

  const parsed = parseSpellForDisplay(spell.data)

  const handleAdd = () => {
    if (!selectedChar) {
      toast.error('Выбери персонажа')
      return
    }

    startTransition(async () => {
      const res = await addSrdSpellToCharacter(spell.key, selectedChar, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Заклинание добавлено')
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-4">
          <div>
            <h2 className="text-xl font-bold">{spell.name_ru ?? spell.name ?? parsed.name}</h2>
            <p className="mt-0.5 text-sm text-slate-400 italic">
              {parsed.level === 0 ? 'Заговор' : `${parsed.level} уровень`}
              {parsed.school && `, ${parsed.school.toLowerCase()}`}
              {parsed.ritual && ' (ритуал)'}
              {parsed.concentration && ' (концентрация)'}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-1 transition hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-950/50 p-3">
            <div>
              <span className="text-slate-500">Время:</span>{' '}
              <span className="text-slate-300">{parsed.castingTime || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Дистанция:</span>{' '}
              <span className="text-slate-300">{parsed.range || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Компоненты:</span>{' '}
              <span className="text-slate-300">{parsed.components || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Длительность:</span>{' '}
              <span className="text-slate-300">{parsed.duration || '—'}</span>
            </div>
          </div>

          <div className="whitespace-pre-wrap text-slate-300">
            {parsed.description || 'Описание отсутствует'}
          </div>

          {parsed.higherLevel && (
            <div>
              <h3 className="mb-1 font-semibold text-violet-300">На более высоких уровнях</h3>
              <div className="whitespace-pre-wrap text-slate-300">{parsed.higherLevel}</div>
            </div>
          )}

          {parsed.classes.length > 0 && (
            <div>
              <h3 className="mb-1 font-semibold text-slate-300">Классы</h3>
              <div className="text-slate-400">{parsed.classes.join(', ')}</div>
            </div>
          )}
        </div>

        {characters.length > 0 && (
          <div className="space-y-2 border-t border-slate-800 p-4">
            <label className="block text-sm text-slate-300">Добавить персонажу:</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedChar ?? ''}
                onChange={(e) => setSelectedChar(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Добавляем...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Добавить
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
