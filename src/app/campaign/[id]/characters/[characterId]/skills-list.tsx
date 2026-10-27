'use client'

import { Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { SKILL_ABILITY, type SkillKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { abilityShort, skillLabel } from '@/lib/i18n/labels'
import { Card } from '@/components/ui'

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
  const { t, lang } = useI18n()

  return (
    <Card padding="md">
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        {t('characters.skills')}
      </h3>

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
                'group flex min-h-11 items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors touch-manipulation',
                onRoll && 'hover:bg-[var(--bg-hover)]',
                !onRoll && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  isProficient
                    ? 'bg-[var(--warning)]'
                    : 'border border-[var(--border-strong)] bg-[var(--bg-tertiary)]'
                )}
                title={isProficient ? t('characters.proficient') : t('characters.notProficient')}
              />
              <span className="flex-1 truncate text-[var(--text-secondary)]">
                {skillLabel(lang, skill)}
              </span>
              <span className="shrink-0 text-xs text-[var(--text-subtle)] uppercase">
                {abilityShort(lang, ability)}
              </span>
              <span
                className={cn(
                  'w-10 shrink-0 text-right font-medium',
                  isProficient ? 'text-[var(--warning-text)]' : 'text-[var(--text-muted)]'
                )}
              >
                {formatModifier(bonus)}
              </span>
              {onRoll && (
                <Dices
                  size={16}
                  className="shrink-0 text-[var(--text-subtle)] transition group-hover:text-[var(--text-muted)]"
                />
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
