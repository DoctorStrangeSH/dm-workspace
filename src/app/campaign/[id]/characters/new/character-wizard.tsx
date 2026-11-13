'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { createCharacter } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button, Card } from '@/components/ui'
import WizardStep1 from './wizard-step-1'
import WizardStep2, { type AbilityMode } from './wizard-step-2'
import WizardStep3 from './wizard-step-3'
import WizardStep4 from './wizard-step-4'
import { BACKGROUNDS, CLASSES, RACES } from '@/lib/dnd/constants'
import {
  buildCharacterData,
  getPointsRemaining,
  isStandardArrayUsed,
} from '@/lib/dnd/character-builder'
import { srdSpeciesToRaceInfo, srdClassToClassInfo } from '@/lib/dnd/srd-adapter'
import { baseClassSlug } from '@/lib/dnd/srd-class-utils'
import { suggestedAbilities, eligibleChosenSkills } from '@/lib/dnd/creation-workspace'
import WizardPreview from './wizard-preview'
import type { AbilityKey, SkillKey } from '@/lib/types'
import type { SrdSpecies, SrdClass } from '@/lib/queries/srd'

interface Props {
  campaignId: string
  species: SrdSpecies[]
  classes: SrdClass[]
}

export default function CharacterWizard({ campaignId, species, classes }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const creating = useRef(false)
  const [creationLocked, setCreationLocked] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [name, setName] = useState('')
  const [raceSlug, setRaceSlug] = useState('')
  const [classSlug, setClassSlug] = useState('')
  const [subclassSlug, setSubclassSlug] = useState('')
  const handleClassChange = (slug: string) => {
    setClassSlug(slug)
    setSubclassSlug('')
    setChosenSkills([])
  }
  const [level, setLevel] = useState(1)

  const [abilities, setAbilities] = useState<Record<AbilityKey, number>>({
    str: 8,
    dex: 8,
    con: 8,
    int: 8,
    wis: 8,
    cha: 8,
  })

  const [abilityMode, setAbilityMode] = useState<AbilityMode>('pointbuy')

  const [backgroundSlug, setBackgroundSlug] = useState('')
  const [chosenSkills, setChosenSkills] = useState<SkillKey[]>([])

  const race = useMemo(() => {
    const srd = species.find((s) => s.key === raceSlug)
    return srd ? srdSpeciesToRaceInfo(srd) : RACES.find((r) => r.slug === raceSlug)
  }, [species, raceSlug])

  const classInfo = useMemo(() => {
    const srd = classes.find((c) => c.key === classSlug)
    return srd ? srdClassToClassInfo(srd) : CLASSES.find((c) => c.slug === baseClassSlug(classSlug))
  }, [classes, classSlug])

  const background = BACKGROUNDS.find((b) => b.slug === backgroundSlug)

  const validIdentity =
    name.trim().length >= 2 &&
    name.trim().length <= 150 &&
    !!race &&
    !!classInfo &&
    Number.isInteger(level) &&
    level >= 1 &&
    level <= 20
  const validAbilities =
    abilityMode === 'pointbuy'
      ? Object.values(abilities).every(
          (value) => Number.isInteger(value) && value >= 8 && value <= 15
        ) && getPointsRemaining(abilities) === 0
      : isStandardArrayUsed(Object.values(abilities))
  const validSkills =
    !!background &&
    !!classInfo &&
    chosenSkills.length === classInfo.skillChoices.count &&
    eligibleChosenSkills(chosenSkills, classInfo.skillChoices.from, background.skills).length ===
      chosenSkills.length

  const isStepValid =
    step === 1 ? validIdentity : step === 2 ? validAbilities : step === 3 ? validSkills : true

  const characterData = useMemo(() => {
    if (!race || !classInfo || !background) return null
    const built = buildCharacterData({
      name,
      level,
      race,
      class: classInfo,
      background,
      baseAbilities: abilities,
      chosenSkills,
    })
    return subclassSlug ? { ...built, subclass: subclassSlug } : built
  }, [name, level, race, classInfo, background, abilities, chosenSkills, subclassSlug])

  const handleNext = () => {
    if (!isStepValid) return
    if (step < 4) goTo((step + 1) as 1 | 2 | 3 | 4)
  }

  const handleBack = () => {
    if (step > 1) goTo((step - 1) as 1 | 2 | 3 | 4)
  }

  function goTo(value: 1 | 2 | 3 | 4) {
    setStep(value)
    if (!creationLocked) setError(null)
    requestAnimationFrame(() => {
      heading.current?.focus()
      heading.current?.scrollIntoView({ block: 'start' })
    })
  }

  const previewData =
    race && classInfo
      ? buildCharacterData({
          name,
          level,
          race,
          class: classInfo,
          background: background ?? BACKGROUNDS[0],
          baseAbilities: abilities,
          chosenSkills,
        })
      : null

  const handleCreate = () => {
    if (!characterData || !validIdentity || !validAbilities || !validSkills || creating.current)
      return
    creating.current = true
    setCreationLocked(true)
    setError(null)

    startTransition(async () => {
      try {
        const res = await createCharacter(campaignId, name.trim(), characterData)
        if ('error' in res) {
          setError(res.error ?? t('common.error'))
          creating.current = false
          setCreationLocked(false)
          return
        }
        toast.success(t('characters.toast.created'))
        router.push(`/campaign/${campaignId}/characters/${res.characterId}`)
        router.refresh()
      } catch {
        setError(t('prep.uncertain'))
        // Keep creation locked: a lost response may still have created the character.
      }
    })
  }

  const steps = [
    { number: 1, label: t('characters.wizard.step1') },
    { number: 2, label: t('characters.wizard.step2') },
    { number: 3, label: t('characters.wizard.step3') },
    { number: 4, label: t('characters.wizard.step4') },
  ]

  return (
    <div>
      {/* Прогресс-бар */}
      <nav
        aria-label={t('prep.steps')}
        className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:items-center"
      >
        {steps.map((s, i) => (
          <div key={s.number} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={s.number >= step || isPending}
              onClick={() => goTo(s.number as 1 | 2 | 3 | 4)}
              aria-label={s.label}
              aria-current={step === s.number ? 'step' : undefined}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                step === s.number
                  ? 'bg-[var(--accent)] text-white'
                  : step > s.number
                    ? 'border border-[var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success-text)]'
                    : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-subtle)]'
              )}
            >
              {step > s.number ? <Check size={14} /> : s.number}
            </button>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                step === s.number ? 'text-[var(--text-primary)]' : 'text-[var(--text-subtle)]'
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-[var(--border-default)]" />
            )}
          </div>
        ))}
      </nav>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <h2
            ref={heading}
            tabIndex={-1}
            className="mb-3 scroll-mt-[calc(var(--campaign-header-height,10rem)+1rem)] text-lg font-semibold text-[var(--text-primary)]"
          >
            {steps[step - 1].label}
          </h2>

          <Card padding="lg" className="min-w-0">
            {step === 1 && (
              <WizardStep1
                name={name}
                setName={setName}
                raceSlug={raceSlug}
                setRaceSlug={setRaceSlug}
                classSlug={classSlug}
                setClassSlug={handleClassChange}
                subclassSlug={subclassSlug}
                setSubclassSlug={setSubclassSlug}
                level={level}
                setLevel={setLevel}
                species={species}
                classes={classes}
              />
            )}

            {step === 2 && (
              <WizardStep2
                abilities={abilities}
                setAbilities={setAbilities}
                mode={abilityMode}
                setMode={setAbilityMode}
                onSuggest={
                  classInfo
                    ? () => setAbilities(suggestedAbilities(classInfo.primaryAbility, abilityMode))
                    : undefined
                }
              />
            )}

            {step === 3 && (
              <WizardStep3
                classInfo={classInfo}
                backgroundSlug={backgroundSlug}
                setBackgroundSlug={setBackgroundSlug}
                chosenSkills={chosenSkills}
                setChosenSkills={setChosenSkills}
              />
            )}

            {step === 4 && characterData && <WizardStep4 name={name} data={characterData} />}

            {step === 4 && !characterData && (
              <div className="py-12 text-center text-sm text-[var(--text-subtle)]">
                {t('characters.wizard.missingData')}
              </div>
            )}
          </Card>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-[var(--danger)] p-3 text-sm text-[var(--danger-text)]"
            >
              {error}
            </p>
          )}
          {step < 4 && !isStepValid && (
            <p role="status" className="mt-3 text-sm text-[var(--text-secondary)]">
              {t(`prep.help${step}`)}
            </p>
          )}

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-3 mt-6 flex items-center justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--bg-app)]/95 px-3 py-3 shadow-[0_-6px_18px_rgb(0_0_0/0.12)] backdrop-blur md:static md:mx-0 md:mt-8 md:bg-transparent md:px-0 md:pt-6 md:pb-0 md:shadow-none md:backdrop-blur-none">
            <Button
              variant="secondary"
              size="md"
              onClick={handleBack}
              disabled={step === 1 || isPending}
              icon={<ChevronLeft size={16} />}
            >
              {t('common.back')}
            </Button>

            {step < 4 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={!isStepValid || isPending}
                icon={<ChevronRight size={16} />}
                iconPosition="right"
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleCreate}
                disabled={
                  isPending ||
                  !characterData ||
                  !validIdentity ||
                  !validAbilities ||
                  !validSkills ||
                  creationLocked
                }
                loading={isPending}
                icon={<Check size={16} />}
              >
                {t('characters.create')}
              </Button>
            )}
          </div>
        </div>
        {step < 4 && <WizardPreview name={name} data={previewData} hasBackground={!!background} />}
      </div>
    </div>
  )
}
