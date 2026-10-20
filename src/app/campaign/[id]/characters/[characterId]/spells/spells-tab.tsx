'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Moon } from 'lucide-react'
import { longRest } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { EmptyState } from '@/components/ui'
import SpellCard from './spell-card'
import SpellSlotsTracker from './spell-slots-tracker'
import AddSpellDialog from './add-spell-dialog'
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/dnd/formulas'
import type { Character, CharacterSpell, CharacterData } from '@/lib/types'

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

  // CHANGES: обёрнуто в useMemo, чтобы ссылка на spells была стабильной.
  // Раньше `data.spells ?? []` создавал новый [] каждый рендер,
  // из-за чего useMemo(spellsByLevel) пересчитывался всегда.
  const spells = useMemo(() => character.data_json.spells ?? [], [character.data_json.spells])
  const slots = data.spellSlots ?? {}

  const spellsByLevel = useMemo(() => {
    const groups: Record<number, CharacterSpell[]> = {}
    for (const s of spells) {
      if (!groups[s.level]) groups[s.level] = []
      groups[s.level].push(s)
    }
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
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Долгий отдых завершён')
        router.refresh()
      }
    })
  }

  const handleRoll = (spell: CharacterSpell) => {
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

    toast.info(`${spell.name}: ${formatModifier(bonus)} = ${total}`, {
      description: `Атака заклинанием: [${roll}] ${formatModifier(bonus)}`,
    })
  }

  const levelKeys = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canEdit && (
          <>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white transition hover:bg-indigo-500"
            >
              <Plus size={14} />
              Добавить заклинание
            </button>

            <button
              onClick={handleLongRest}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Moon size={14} />
              Долгий отдых
            </button>
          </>
        )}

        <div className="ml-auto text-sm text-slate-500">Всего: {spells.length}</div>
      </div>

      <SpellSlotsTracker
        characterId={character.id}
        campaignId={campaignId}
        slots={slots}
        canEdit={canEdit}
      />

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
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-400 uppercase">
                <Sparkles size={14} className="text-violet-400" />
                {level === 0 ? 'Заговоры' : `${level} уровень`}
                <span className="font-normal text-slate-600">({spellsByLevel[level].length})</span>
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
