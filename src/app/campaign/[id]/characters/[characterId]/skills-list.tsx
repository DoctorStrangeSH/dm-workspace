'use client'

import { Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { ABILITY_LABELS, SKILL_LABELS, SKILL_ABILITY, type SkillKey } from '@/lib/types'
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

export default function SkillsList({ proficientSkills, getBonus, onRoll }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-400 uppercase">Навыки</h3>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
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
                'group flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition',
                onRoll && 'hover:bg-slate-800/60',
                !onRoll && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  isProficient ? 'bg-amber-400' : 'border border-slate-600 bg-slate-700'
                )}
                title={isProficient ? 'Владение' : 'Без владения'}
              />
              <span className="flex-1 truncate text-slate-300">{SKILL_LABELS[skill]}</span>
              <span className="shrink-0 text-xs text-slate-500 uppercase">
                {ABILITY_LABELS[ability].slice(0, 3)}
              </span>
              <span
                className={cn(
                  'w-10 shrink-0 text-right font-medium',
                  isProficient ? 'text-amber-300' : 'text-slate-400'
                )}
              >
                {formatModifier(bonus)}
              </span>
              {onRoll && (
                <Dices
                  size={12}
                  className="shrink-0 text-slate-600 transition group-hover:text-slate-300"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
