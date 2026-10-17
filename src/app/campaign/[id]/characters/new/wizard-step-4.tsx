'use client'

import {
  abilityModifier,
  formatModifier,
  getSaveBonus,
} from '@/lib/dnd/formulas'
import { BACKGROUNDS, CLASSES, RACES } from '@/lib/dnd/constants'
import {
  ABILITY_LABELS,
  ABILITY_SHORT,
  SKILL_LABELS,
  type AbilityKey,
  type CharacterData,
  type SkillKey,
} from '@/lib/types'

interface Props {
  name: string
  data: CharacterData
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function WizardStep4({ name, data }: Props) {
  const race = RACES.find((r) => r.slug === data.race)
  const cls = CLASSES.find((c) => c.slug === data.class)
  const background = BACKGROUNDS.find((b) => b.slug === data.background)

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-center justify-center text-2xl">
            ⚔️
          </div>
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-slate-400">
              {race?.name} · {cls?.name} · Уровень {data.level}
            </p>
            <p className="text-xs text-slate-500">
              Предыстория: {background?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITIES.map((ab) => {
            const score = data.abilities[ab]
            const mod = abilityModifier(score)
            return (
              <div
                key={ab}
                className="text-center bg-slate-950 border border-slate-800 rounded-lg py-2"
              >
                <div className="text-[10px] text-slate-500 uppercase">
                  {ABILITY_SHORT[ab]}
                </div>
                <div className="text-lg font-bold">{score}</div>
                <div className="text-xs text-slate-500">
                  {formatModifier(mod)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500">HP</div>
          <div className="text-2xl font-bold text-red-400">
            {data.hp.max}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500">AC</div>
          <div className="text-2xl font-bold text-sky-400">{data.ac}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500">Скорость</div>
          <div className="text-2xl font-bold text-emerald-400">
            {data.speed}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Навыки
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSkills ?? []).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 bg-green-950/40 border border-green-900/50 text-green-300 rounded text-xs"
            >
              {SKILL_LABELS[skill as SkillKey]}
            </span>
          ))}
          {(!data.proficientSkills || data.proficientSkills.length === 0) && (
            <span className="text-xs text-slate-500">Нет навыков</span>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Спасброски (владение)
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSaves ?? []).map((save) => (
            <span
              key={save}
              className="px-2 py-1 bg-indigo-950/40 border border-indigo-900/50 text-indigo-300 rounded text-xs"
            >
              {ABILITY_LABELS[save]} ({formatModifier(getSaveBonus(data, save))})
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}