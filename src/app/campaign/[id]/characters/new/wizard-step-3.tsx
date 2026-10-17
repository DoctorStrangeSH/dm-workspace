'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { BACKGROUNDS, type ClassInfo } from '@/lib/dnd/constants'
import {
  ABILITY_LABELS,
  SKILL_LABELS,
  SKILL_ABILITY,
  type SkillKey,
  type BackgroundInfo,
} from '@/lib/types'

interface Props {
  classInfo: ClassInfo | undefined
  backgroundSlug: string
  setBackgroundSlug: (slug: string) => void
  chosenSkills: SkillKey[]
  setChosenSkills: (skills: SkillKey[]) => void
}

export default function WizardStep3({
  classInfo,
  backgroundSlug,
  setBackgroundSlug,
  chosenSkills,
  setChosenSkills,
}: Props) {
  const background = BACKGROUNDS.find((b) => b.slug === backgroundSlug)

  const classSkillChoices = classInfo?.skillChoices
  const maxSkills = classSkillChoices?.count ?? 0
  const availableSkills = classSkillChoices?.from ?? []

  const backgroundSkills = background?.skills ?? []
  const allChosen = Array.from(new Set([...chosenSkills, ...backgroundSkills]))

  const toggleSkill = (skill: SkillKey) => {
    // Нельзя убрать навык от предыстории
    if (backgroundSkills.includes(skill)) return

    if (chosenSkills.includes(skill)) {
      setChosenSkills(chosenSkills.filter((s) => s !== skill))
    } else if (chosenSkills.length < maxSkills) {
      setChosenSkills([...chosenSkills, skill])
    }
  }

  return (
    <div className="space-y-6">
      {/* Предыстория */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Предыстория <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.slug}
              type="button"
              onClick={() => {
                setBackgroundSlug(bg.slug)
                // Убираем навыки от старой предыстории
                const oldBg = BACKGROUNDS.find((b) => b.slug === backgroundSlug)
                if (oldBg) {
                  setChosenSkills(
                    chosenSkills.filter((s) => !oldBg.skills.includes(s))
                  )
                }
              }}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition text-left',
                backgroundSlug === bg.slug
                  ? 'bg-indigo-950/60 border-indigo-600 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              )}
            >
              {bg.name}
            </button>
          ))}
        </div>
        {background && (
          <p className="text-xs text-slate-500 mt-2">
            Даёт владение:{' '}
            {background.skills.map((s) => SKILL_LABELS[s]).join(', ')}
          </p>
        )}
      </div>

      {/* Навыки от класса */}
      {classInfo && (
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Навыки класса (выбрано {chosenSkills.length} из {maxSkills})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {availableSkills.map((skill) => {
              const isChosen = chosenSkills.includes(skill)
              const isFromBackground = backgroundSkills.includes(skill)
              const isDisabled =
                isFromBackground ||
                (!isChosen && chosenSkills.length >= maxSkills)

              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  disabled={isDisabled}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border transition text-left',
                    isChosen || isFromBackground
                      ? 'bg-green-950/60 border-green-800 text-green-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700',
                    isDisabled && !isChosen && !isFromBackground && 'opacity-40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{SKILL_LABELS[skill]}</span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {ABILITY_LABELS[SKILL_ABILITY[skill]].slice(0, 3)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          {chosenSkills.length < maxSkills && (
            <p className="text-xs text-amber-400 mt-2">
              ⚠️ Выбери ещё {maxSkills - chosenSkills.length} навык(а)
            </p>
          )}
        </div>
      )}
    </div>
  )
}