'use client'

import { abilityModifier, formatModifier, getSaveBonus } from '@/lib/dnd/formulas'
import { BACKGROUNDS } from '@/lib/dnd/constants'
import { characterClassName, characterSpeciesName } from '@/lib/dnd/character-display-names'
import type { AbilityKey, CharacterData, SkillKey } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { abilityLabel, abilityShort, skillLabel } from '@/lib/i18n/labels'
import { Card } from '@/components/ui'

interface Props {
  name: string
  data: CharacterData
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function WizardStep4({ name, data }: Props) {
  const { t, lang } = useI18n()

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
              {characterSpeciesName(data.race, lang)} · {characterClassName(data.class, lang)} ·{' '}
              {t('characters.level', { level: data.level })}
            </p>
            <p className="text-xs text-[var(--text-subtle)]">
              {t('characters.wizard.background')}: {background?.name}
            </p>
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
                  {abilityShort(lang, ab)}
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
          <div className="text-xs text-[var(--text-subtle)]">{t('characters.speed')}</div>
          <div className="text-2xl font-bold text-[var(--success)]">{data.speed}</div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t('characters.skills')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSkills ?? []).map((skill) => (
            <span
              key={skill}
              className="rounded border border-[var(--success)]/30 bg-[var(--success-subtle)] px-2 py-1 text-xs text-[var(--success-text)]"
            >
              {skillLabel(lang, skill as SkillKey)}
            </span>
          ))}
          {(!data.proficientSkills || data.proficientSkills.length === 0) && (
            <span className="text-xs text-[var(--text-subtle)]">{t('characters.noSkills')}</span>
          )}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t('characters.saves')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data.proficientSaves ?? []).map((save) => (
            <span
              key={save}
              className="rounded border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-2 py-1 text-xs text-[var(--accent-text)]"
            >
              {abilityLabel(lang, save)} ({formatModifier(getSaveBonus(data, save))})
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
