'use client'

import { abilityModifier, formatModifier, getSaveBonus } from '@/lib/dnd/formulas'
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-900/50 bg-amber-950/40 text-2xl">
            ⚔️
          </div>
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-slate-400">
              {race?.name} · {cls?.name} · Уровень {data.level}
            </p>
            <p className="text-xs text-slate-500">Предыстория: {background?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILITIES.map((ab) => {
            const score = data.abilities[ab]
            const mod = abilityModifier(score)
            return (
              <div
                key={ab}
                className="rounded-lg border border-slate-800 bg-slate-950 py-2 text-center"
              >
                <div className="text-[10px] text-slate-500 uppercase">{ABILITY_SHORT[ab]}</div>
                <div className="text-lg font-bold">{score}</div>
                <div className="text-xs text-slate-500">{formatModifier(mod)}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
          <div className="text-xs text-slate-500">HP</div>
          <div className="text-2xl font-bold text-red-400">{data.hp.max}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
          <div className="text-xs text-slate-500">AC</div>
          <div className="text-2xl font-bold text-sky-400">{data.ac}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center">
          <div className="text-xs text-slate-500">Скорость</div>
          <div className="text-2xl font-bold text-emerald-400">{data.speed}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-400 uppercase">
          Навыки
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSkills ?? []).map((skill) => (
            <span
              key={skill}
              className="rounded border border-green-900/50 bg-green-950/40 px-2 py-1 text-xs text-green-300"
            >
              {SKILL_LABELS[skill as SkillKey]}
            </span>
          ))}
          {(!data.proficientSkills || data.proficientSkills.length === 0) && (
            <span className="text-xs text-slate-500">Нет навыков</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-400 uppercase">
          Спасброски (владение)
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSaves ?? []).map((save) => (
            <span
              key={save}
              className="rounded border border-indigo-900/50 bg-indigo-950/40 px-2 py-1 text-xs text-indigo-300"
            >
              {ABILITY_LABELS[save]} ({formatModifier(getSaveBonus(data, save))})
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
