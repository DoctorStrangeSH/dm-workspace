'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Dices, Trash2, Check } from 'lucide-react'
import {
  updateSpell,
  removeSpell,
} from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import {
  SPELL_SCHOOLS,
  type CharacterSpell,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  spell: CharacterSpell
  characterId: string
  campaignId: string
  canEdit: boolean
  onRoll?: (spell: CharacterSpell) => void
}

export default function SpellCard({
  spell,
  characterId,
  campaignId,
  canEdit,
  onRoll,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const togglePrepared = () => {
    startTransition(async () => {
      const res = await updateSpell(characterId, campaignId, spell.id, {
        prepared: !spell.prepared,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Удалить заклинание «${spell.name}»?`)) return

    startTransition(async () => {
      const res = await removeSpell(characterId, campaignId, spell.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Заклинание удалено')
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-800/60 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Prepared */}
        {canEdit && spell.level > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              togglePrepared()
            }}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition',
              spell.prepared
                ? 'bg-violet-600 border-violet-500'
                : 'border-slate-700 hover:border-slate-500'
            )}
            title={spell.prepared ? 'Подготовлено' : 'Не подготовлено'}
          >
            {spell.prepared && <Check size={10} className="text-white" />}
          </button>
        )}

        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-slate-500 transition',
            isOpen && 'rotate-180'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200 truncate">
              {spell.name}
            </span>
            {spell.ritual && (
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-900/50 text-indigo-300 rounded">
                Ритуал
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {spell.school && SPELL_SCHOOLS[spell.school]}
            {spell.castingTime && ` · ${spell.castingTime}`}
          </div>
        </div>

        {onRoll && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRoll(spell)
            }}
            className="p-1.5 hover:bg-slate-700 rounded transition"
            title="Бросок"
          >
            <Dices size={14} className="text-slate-400" />
          </button>
        )}

        {canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={isPending}
            className="p-1.5 hover:bg-red-950/40 rounded transition disabled:opacity-50"
            title="Удалить"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="px-3 pb-3 border-t border-slate-800 bg-slate-950/40">
          <div className="grid grid-cols-2 gap-2 py-3 text-xs">
            {spell.range && (
              <div>
                <span className="text-slate-500">Дистанция:</span>{' '}
                <span className="text-slate-300">{spell.range}</span>
              </div>
            )}
            {spell.components && (
              <div>
                <span className="text-slate-500">Компоненты:</span>{' '}
                <span className="text-slate-300">{spell.components}</span>
              </div>
            )}
            {spell.duration && (
              <div>
                <span className="text-slate-500">Длительность:</span>{' '}
                <span className="text-slate-300">{spell.duration}</span>
              </div>
            )}
          </div>

          {spell.description && (
            <div className="pb-2 text-sm text-slate-300 whitespace-pre-wrap">
              {spell.description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}