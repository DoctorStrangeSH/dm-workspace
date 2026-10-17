'use client'

import { Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import {
  ABILITY_LABELS,
  SKILL_LABELS,
  SKILL_ABILITY,
  type SkillKey,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  proficientSkills: SkillKey[]
  proficiencyBonus: number
  getBonus: (skill: SkillKey) => number
  onRoll?: (skill: SkillKey) => void
}

const ALL_SKILLS: SkillKey[] = [
  'acrobatics',
  'animal-handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight-of-hand',
  'stealth',
  'survival',
]

export default function SkillsList({
  proficientSkills,
  getBonus,
  onRoll,
}: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Навыки
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {ALL_SKILLS.map((skill) => {
          const isProficient = proficientSkills.includes(skill)
          const bonus = getBonus(skill)
          const ability = SKILL_ABILITY[skill]

          return (
            <button
              key={skill}
              type="button"
              onClick={() => onRoll?.(skill)}
              disabled={!onRoll}
              className={cn(
                'group flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition',
                onRoll && 'hover:bg-slate-800/60',
                !onRoll && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  isProficient
                    ? 'bg-amber-400'
                    : 'bg-slate-700 border border-slate-600'
                )}
                title={isProficient ? 'Владение' : 'Без владения'}
              />
              <span className="flex-1 truncate text-slate-300">
                {SKILL_LABELS[skill]}
              </span>
              <span className="text-xs text-slate-500 uppercase shrink-0">
                {ABILITY_LABELS[ability].slice(0, 3)}
              </span>
              <span
                className={cn(
                  'font-medium shrink-0 w-10 text-right',
                  isProficient ? 'text-amber-300' : 'text-slate-400'
                )}
              >
                {formatModifier(bonus)}
              </span>
              {onRoll && (
                <Dices
                  size={12}
                  className="text-slate-600 group-hover:text-slate-300 shrink-0 transition"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}