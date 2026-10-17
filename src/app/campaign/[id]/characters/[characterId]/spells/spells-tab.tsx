'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Moon } from 'lucide-react'
import { longRest } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import EmptyState from '@/components/empty-state'
import SpellCard from './spell-card'
import SpellSlotsTracker from './spell-slots-tracker'
import AddSpellDialog from './add-spell-dialog'
import {
  abilityModifier,
  formatModifier,
  proficiencyBonus,
} from '@/lib/dnd/formulas'
import type {
  Character,
  CharacterSpell,
  CharacterData,
} from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  canEdit: boolean
}

export default function SpellsTab({ character, campaignId, canEdit }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const data: CharacterData = character.data_json
  const spells = data.spells ?? []
  const slots = data.spellSlots ?? {}

  // Группировка по уровню
  const spellsByLevel = useMemo(() => {
    const groups: Record<number, CharacterSpell[]> = {}
    for (const s of spells) {
      if (!groups[s.level]) groups[s.level] = []
      groups[s.level].push(s)
    }
    // Сортируем по названию внутри группы
    for (const level in groups) {
      groups[level].sort((a, b) => a.name.localeCompare(b.name))
    }
    return groups
  }, [spells])

  const handleLongRest = () => {
    if (!confirm('Завершить долгий отдых? Восстановятся HP, ячейки заклинаний и death saves.')) {
      return
    }

    startTransition(async () => {
      const res = await longRest(character.id, campaignId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Долгий отдых завершён')
        router.refresh()
      }
    })
  }

  const handleRoll = (spell: CharacterSpell) => {
    // Бросок атаки заклинанием
    const spellAbility = data.spellcastingAbility
    if (!spellAbility) {
      toast.info(`${spell.name}`, {
        description: 'Не указана заклинательная характеристика',
      })
      return
    }

    const mod = abilityModifier(data.abilities[spellAbility])
    const prof = proficiencyBonus(data.level)
    const bonus = mod + prof
    const roll = Math.floor(Math.random() * 20) + 1
    const total = roll + bonus

    toast.info(
      `${spell.name}: ${formatModifier(bonus)} = ${total}`,
      { description: `Атака заклинанием: [${roll}] ${formatModifier(bonus)}` }
    )
  }

  const levelKeys = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div>
      {/* Панель действий */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {canEdit && (
          <>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition"
            >
              <Plus size={14} />
              Добавить заклинание
            </button>

            <button
              onClick={handleLongRest}
              disabled={isPending}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition disabled:opacity-50"
            >
              <Moon size={14} />
              Долгий отдых
            </button>
          </>
        )}

        <div className="ml-auto text-sm text-slate-500">
          Всего: {spells.length}
        </div>
      </div>

      {/* Spell Slots */}
      <SpellSlotsTracker
        characterId={character.id}
        campaignId={campaignId}
        slots={slots}
        canEdit={canEdit}
      />

      {/* Список заклинаний */}
      {spells.length === 0 ? (
        <EmptyState
          icon="✨"
          title="Заклинаний пока нет"
          description={
            canEdit
              ? 'Добавь первое заклинание — вручную или из справочника (скоро).'
              : 'У персонажа нет заклинаний.'
          }
          size="md"
          dashed={false}
        />
      ) : (
        <div className="space-y-4">
          {levelKeys.map((level) => (
            <div key={level}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Sparkles size={14} className="text-violet-400" />
                {level === 0 ? 'Заговоры' : `${level} уровень`}
                <span className="text-slate-600 font-normal">
                  ({spellsByLevel[level].length})
                </span>
              </h3>

              <div className="space-y-1.5">
                {spellsByLevel[level].map((spell) => (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    characterId={character.id}
                    campaignId={campaignId}
                    canEdit={canEdit}
                    onRoll={handleRoll}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Spell Dialog */}
      {showAddDialog && (
        <AddSpellDialog
          characterId={character.id}
          campaignId={campaignId}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  )
}