'use client'

import { cn } from '@/lib/utils'
import { BACKGROUNDS, type ClassInfo } from '@/lib/dnd/constants'
import { ABILITY_LABELS, SKILL_LABELS, SKILL_ABILITY, type SkillKey } from '@/lib/types'

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

  const toggleSkill = (skill: SkillKey) => {
    if (backgroundSkills.includes(skill)) return

    if (chosenSkills.includes(skill)) {
      setChosenSkills(chosenSkills.filter((s) => s !== skill))
    } else if (chosenSkills.length < maxSkills) {
      setChosenSkills([...chosenSkills, skill])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          Предыстория <span className="text-[var(--danger)]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.slug}
              type="button"
              onClick={() => {
                setBackgroundSlug(bg.slug)
                const oldBg = BACKGROUNDS.find((b) => b.slug === backgroundSlug)
                if (oldBg) {
                  setChosenSkills(chosenSkills.filter((s) => !oldBg.skills.includes(s)))
                }
              }}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                backgroundSlug === bg.slug
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
              )}
            >
              {bg.name}
            </button>
          ))}
        </div>
        {background && (
          <p className="mt-2 text-xs text-[var(--text-subtle)]">
            Даёт владение: {background.skills.map((s) => SKILL_LABELS[s]).join(', ')}
          </p>
        )}
      </div>

      {classInfo && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Навыки класса (выбрано {chosenSkills.length} из {maxSkills})
          </label>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {availableSkills.map((skill) => {
              const isChosen = chosenSkills.includes(skill)
              const isFromBackground = backgroundSkills.includes(skill)
              const isDisabled = isFromBackground || (!isChosen && chosenSkills.length >= maxSkills)

              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  disabled={isDisabled}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    isChosen || isFromBackground
                      ? 'border-[var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success-text)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--border-hover)]',
                    isDisabled && !isChosen && !isFromBackground && 'opacity-40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{SKILL_LABELS[skill]}</span>
                    <span className="text-[10px] text-[var(--text-subtle)] uppercase">
                      {ABILITY_LABELS[SKILL_ABILITY[skill]].slice(0, 3)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          {chosenSkills.length < maxSkills && (
            <p className="mt-2 text-xs text-[var(--warning-text)]">
              ⚠️ Выбери ещё {maxSkills - chosenSkills.length} навык(а)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
