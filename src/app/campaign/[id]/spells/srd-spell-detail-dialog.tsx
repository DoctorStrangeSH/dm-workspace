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

export default function SrdSpellDetailDialog({
  spell,
  campaignId,
  characters,
  onClose,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedChar, setSelectedChar] = useState<string | null>(
    characters[0]?.id ?? null
  )

  const parsed = parseSpellForDisplay(spell.data)

  const handleAdd = () => {
    if (!selectedChar) {
      toast.error('Выбери персонажа')
      return
    }

    startTransition(async () => {
      const res = await addSrdSpellToCharacter(
        spell.key,
        selectedChar,
        campaignId
      )
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold">
              {spell.name_ru ?? spell.name ?? parsed.name}
            </h2>
            <p className="text-sm text-slate-400 italic mt-0.5">
              {parsed.level === 0 ? 'Заговор' : `${parsed.level} уровень`}
              {parsed.school && `, ${parsed.school.toLowerCase()}`}
              {parsed.ritual && ' (ритуал)'}
              {parsed.concentration && ' (концентрация)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/50 rounded-lg">
            <div>
              <span className="text-slate-500">Время:</span>{' '}
              <span className="text-slate-300">
                {parsed.castingTime || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Дистанция:</span>{' '}
              <span className="text-slate-300">{parsed.range || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Компоненты:</span>{' '}
              <span className="text-slate-300">
                {parsed.components || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Длительность:</span>{' '}
              <span className="text-slate-300">{parsed.duration || '—'}</span>
            </div>
          </div>

          <div className="text-slate-300 whitespace-pre-wrap">
            {parsed.description || 'Описание отсутствует'}
          </div>

          {parsed.higherLevel && (
            <div>
              <h3 className="font-semibold text-violet-300 mb-1">
                На более высоких уровнях
              </h3>
              <div className="text-slate-300 whitespace-pre-wrap">
                {parsed.higherLevel}
              </div>
            </div>
          )}

          {parsed.classes.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-300 mb-1">Классы</h3>
              <div className="text-slate-400">{parsed.classes.join(', ')}</div>
            </div>
          )}
        </div>

        {characters.length > 0 && (
          <div className="p-4 border-t border-slate-800 space-y-2">
            <label className="block text-sm text-slate-300">
              Добавить персонажу:
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedChar ?? ''}
                onChange={(e) => setSelectedChar(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
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
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
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