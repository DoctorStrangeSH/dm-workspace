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
import { Card } from '@/components/ui'

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
      <Card padding="lg">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-subtle)] text-2xl">
            ⚔️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{name}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {race?.name} · {cls?.name} · Уровень {data.level}
            </p>
            <p className="text-xs text-[var(--text-subtle)]">Предыстория: {background?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILITIES.map((ab) => {
            const score = data.abilities[ab]
            const mod = abilityModifier(score)
            return (
              <div
                key={ab}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] py-2 text-center"
              >
                <div className="text-[10px] text-[var(--text-subtle)] uppercase">
                  {ABILITY_SHORT[ab]}
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)]">{score}</div>
                <div className="text-xs text-[var(--text-subtle)]">{formatModifier(mod)}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <div className="text-xs text-[var(--text-subtle)]">HP</div>
          <div className="text-2xl font-bold text-[var(--danger)]">{data.hp.max}</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-xs text-[var(--text-subtle)]">AC</div>
          <div className="text-2xl font-bold text-[var(--info)]">{data.ac}</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-xs text-[var(--text-subtle)]">Скорость</div>
          <div className="text-2xl font-bold text-[var(--success)]">{data.speed}</div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Навыки
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSkills ?? []).map((skill) => (
            <span
              key={skill}
              className="rounded border border-[var(--success)]/30 bg-[var(--success-subtle)] px-2 py-1 text-xs text-[var(--success-text)]"
            >
              {SKILL_LABELS[skill as SkillKey]}
            </span>
          ))}
          {(!data.proficientSkills || data.proficientSkills.length === 0) && (
            <span className="text-xs text-[var(--text-subtle)]">Нет навыков</span>
          )}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Спасброски (владение)
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSaves ?? []).map((save) => (
            <span
              key={save}
              className="rounded border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-2 py-1 text-xs text-[var(--accent-text)]"
            >
              {ABILITY_LABELS[save]} ({formatModifier(getSaveBonus(data, save))})
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
