'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, TrendingUp } from 'lucide-react'
import { updateCharacter } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { Breadcrumbs } from '@/components/breadcrumbs'
import AbilityBox from './ability-box'
import CombatStats from './combat-stats'
import HPTracker from './hp-tracker'
import DeathSavesTracker from './death-saves-tracker'
import SkillsList from './skills-list'
import SavesList from './saves-list'
import CharacterTabs from './character-tabs'
import SpellsTab from './spells/spells-tab'
import InventoryTab from './inventory-tab'
import FeaturesTab from './features-tab'
import LevelUpDialog from './level-up-dialog'
import {
  abilityModifier,
  formatModifier,
  getSaveBonus,
  getSkillBonus,
  getInitiative,
  getPassivePerception,
  proficiencyBonus,
  parseDice,
  rollDice,
} from '@/lib/dnd/formulas'
import { RACES, CLASSES } from '@/lib/dnd/constants'
import {
  ABILITY_LABELS,
  SKILL_LABELS,
  ABILITY_SHORT,
  type AbilityKey,
  type SkillKey,
} from '@/lib/types'
import type { Character } from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  campaignName: string
  owner: { display_name: string | null; username: string }
  canEdit: boolean
  isDm: boolean
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function CharacterSheet({
  character,
  campaignId,
  campaignName,
  owner,
  canEdit,
  isDm,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(character.name)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const data = character.data_json
  const profBonus = proficiencyBonus(data.level)

  const race = RACES.find((r) => r.slug === data.race)
  const cls = CLASSES.find((c) => c.slug === data.class)

  const handleSaveName = () => {
    if (editName.trim() === character.name) {
      setIsEditingName(false)
      return
    }
    startTransition(async () => {
      const res = await updateCharacter(character.id, campaignId, {
        name: editName,
      })
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        setEditName(character.name)
      } else {
        toast.success('Имя обновлено')
        setIsEditingName(false)
        router.refresh()
      }
    })
  }

  const rollAbility = (ability: AbilityKey) => {
    const mod = abilityModifier(data.abilities[ability])
    const expr = parseDice(`1d20${mod >= 0 ? '+' : ''}${mod}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(
      `${ABILITY_LABELS[ability]}: ${formatModifier(mod)} = ${result.total}`,
      { description: `[${result.rolls.join(', ')}] ${formatModifier(mod)}` }
    )
  }

  const rollSave = (ability: AbilityKey) => {
    const bonus = getSaveBonus(data, ability)
    const expr = parseDice(`1d20${bonus >= 0 ? '+' : ''}${bonus}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(
      `Спасбросок ${ABILITY_SHORT[ability]}: ${formatModifier(bonus)} = ${result.total}`,
      { description: `[${result.rolls.join(', ')}] ${formatModifier(bonus)}` }
    )
  }

  const rollSkill = (skill: SkillKey) => {
    const bonus = getSkillBonus(data, skill)
    const expr = parseDice(`1d20${bonus >= 0 ? '+' : ''}${bonus}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(
      `${SKILL_LABELS[skill]}: ${formatModifier(bonus)} = ${result.total}`,
      { description: `[${result.rolls.join(', ')}] ${formatModifier(bonus)}` }
    )
  }

  const rollInitiative = () => {
    const bonus = getInitiative(data)
    const expr = parseDice(`1d20${bonus >= 0 ? '+' : ''}${bonus}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(
      `Инициатива: ${formatModifier(bonus)} = ${result.total}`,
      { description: `[${result.rolls.join(', ')}] ${formatModifier(bonus)}` }
    )
  }

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaignName, href: `/campaign/${campaignId}` },
          { label: 'Персонажи', href: `/campaign/${campaignId}/characters` },
          { label: character.name },
        ]}
        className="mb-4"
      />

      {/* Заголовок */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-center justify-center text-3xl">
            ⚔️
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setEditName(character.name)
                      setIsEditingName(false)
                    }
                  }}
                  autoFocus
                  className="text-xl font-bold bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <Check size={16} className="text-green-400" />
                </button>
                <button
                  onClick={() => {
                    setEditName(character.name)
                    setIsEditingName(false)
                  }}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{character.name}</h1>
                {canEdit && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-slate-800 rounded transition opacity-60 hover:opacity-100"
                    title="Редактировать имя"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-slate-400 mt-1">
              {race?.name} · {cls?.name} · Уровень {data.level}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Владелец: {owner.display_name ?? owner.username}
            </p>

            {canEdit && data.level < 20 && (
              <button
                onClick={() => setShowLevelUp(true)}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-950/40 border border-green-900/50 text-green-300 hover:bg-green-950/60 rounded-lg transition"
                title="Повысить уровень"
              >
                <TrendingUp size={12} />
                Level {data.level} → {data.level + 1}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <CharacterTabs
        overviewContent={
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {ABILITIES.map((ability) => (
                <AbilityBox
                  key={ability}
                  ability={ability}
                  score={data.abilities[ability]}
                  modifier={abilityModifier(data.abilities[ability])}
                  onRoll={() => rollAbility(ability)}
                />
              ))}
            </div>

            <div className="mb-4">
              <CombatStats
                ac={data.ac}
                initiative={getInitiative(data)}
                speed={data.speed}
                passivePerception={getPassivePerception(data)}
                onRollInitiative={rollInitiative}
              />
            </div>

            <div className="mb-4">
              <HPTracker
                characterId={character.id}
                campaignId={campaignId}
                hp={data.hp}
                canEdit={canEdit}
              />
            </div>

            {data.hp.current === 0 && (
              <div className="mb-4">
                <DeathSavesTracker
                  characterId={character.id}
                  campaignId={campaignId}
                  deathSaves={
                    data.deathSaves ?? {
                      successes: 0,
                      failures: 0,
                      stabilized: false,
                    }
                  }
                  canEdit={canEdit}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SavesList
                proficientSaves={data.proficientSaves ?? []}
                getBonus={(ability) => getSaveBonus(data, ability)}
                onRoll={rollSave}
              />
              <SkillsList
                proficientSkills={data.proficientSkills ?? []}
                proficiencyBonus={profBonus}
                getBonus={(skill) => getSkillBonus(data, skill)}
                onRoll={rollSkill}
              />
            </div>
          </>
        }
        spellsContent={
          <SpellsTab
            character={character}
            campaignId={campaignId}
            canEdit={canEdit}
          />
        }
        inventoryContent={
          <InventoryTab
            character={character}
            campaignId={campaignId}
            canEdit={canEdit}
          />
        }
        featuresContent={<FeaturesTab />}
      />

      {showLevelUp && (
        <LevelUpDialog
          character={character}
          campaignId={campaignId}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  )
}