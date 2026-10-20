'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { createCharacter } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import WizardStep1 from './wizard-step-1'
import WizardStep2 from './wizard-step-2'
import WizardStep3 from './wizard-step-3'
import WizardStep4 from './wizard-step-4'
import { BACKGROUNDS } from '@/lib/dnd/constants'
import { buildCharacterData, isStandardArrayUsed } from '@/lib/dnd/character-builder'
import { srdSpeciesToRaceInfo, srdClassToClassInfo } from '@/lib/dnd/srd-adapter'
import type { AbilityKey, SkillKey } from '@/lib/types'
import type { SrdSpecies, SrdClass } from '@/lib/queries/srd'

interface Props {
  campaignId: string
  species: SrdSpecies[]
  classes: SrdClass[]
}

export default function CharacterWizard({ campaignId, species, classes }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Шаг 1
  const [name, setName] = useState('')
  const [raceSlug, setRaceSlug] = useState('')
  const [classSlug, setClassSlug] = useState('')
  const [level, setLevel] = useState(1)

  // Шаг 2
  const [abilities, setAbilities] = useState<Record<AbilityKey, number>>({
    str: 8,
    dex: 8,
    con: 8,
    int: 8,
    wis: 8,
    cha: 8,
  })

  // Шаг 3
  const [backgroundSlug, setBackgroundSlug] = useState('')
  const [chosenSkills, setChosenSkills] = useState<SkillKey[]>([])

  // Адаптеры: SRD → RaceInfo / ClassInfo
  const race = useMemo(() => {
    const srd = species.find((s) => s.key === raceSlug)
    return srd ? srdSpeciesToRaceInfo(srd) : undefined
  }, [species, raceSlug])

  const classInfo = useMemo(() => {
    const srd = classes.find((c) => c.key === classSlug)
    return srd ? srdClassToClassInfo(srd) : undefined
  }, [classes, classSlug])

  const background = BACKGROUNDS.find((b) => b.slug === backgroundSlug)

  // Валидация шага
  const isStepValid = useMemo(() => {
    if (step === 1) {
      return name.trim().length >= 2 && !!raceSlug && !!classSlug
    }
    if (step === 2) {
      return isStandardArrayUsed(Object.values(abilities))
    }
    if (step === 3) {
      const maxSkills = classInfo?.skillChoices.count ?? 0
      return !!backgroundSlug && chosenSkills.length === maxSkills
    }
    return true
  }, [step, name, raceSlug, classSlug, abilities, backgroundSlug, chosenSkills, classInfo])

  // Строим данные персонажа
  const characterData = useMemo(() => {
    if (!race || !classInfo || !background) return null
    return buildCharacterData({
      name,
      level,
      race,
      class: classInfo,
      background,
      baseAbilities: abilities,
      chosenSkills,
    })
  }, [name, level, race, classInfo, background, abilities, chosenSkills])

  const handleNext = () => {
    if (!isStepValid) return
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  const handleCreate = () => {
    if (!characterData) return

    startTransition(async () => {
      const res = await createCharacter(campaignId, name, characterData)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
        return
      }
      toast.success('Персонаж создан')
      router.push(`/campaign/${campaignId}/characters/${res.characterId}`)
      router.refresh()
    })
  }

  const steps = [
    { number: 1, label: 'Основное' },
    { number: 2, label: 'Характеристики' },
    { number: 3, label: 'Навыки' },
    { number: 4, label: 'Проверка' },
  ]

  return (
    <div>
      {/* Прогресс-бар */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.number} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition',
                step === s.number
                  ? 'bg-indigo-600 text-white'
                  : step > s.number
                    ? 'border border-green-800 bg-green-950/60 text-green-300'
                    : 'border border-slate-800 bg-slate-900 text-slate-500'
              )}
            >
              {step > s.number ? <Check size={14} /> : s.number}
            </div>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                step === s.number ? 'text-white' : 'text-slate-500'
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="mx-2 h-px flex-1 bg-slate-800" />}
          </div>
        ))}
      </div>

      {/* Контент шага */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <WizardStep1
            name={name}
            setName={setName}
            raceSlug={raceSlug}
            setRaceSlug={setRaceSlug}
            classSlug={classSlug}
            setClassSlug={setClassSlug}
            level={level}
            setLevel={setLevel}
            species={species}
            classes={classes}
          />
        )}

        {step === 2 && <WizardStep2 abilities={abilities} setAbilities={setAbilities} />}

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
          <div className="py-12 text-center text-sm text-slate-500">
            Не хватает данных (раса / класс / предыстория). Вернись назад.
          </div>
        )}
      </div>

      {/* Навигация */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isPending}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700 disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Назад
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid || isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500 disabled:opacity-50"
          >
            Далее
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !characterData}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium transition hover:bg-green-500 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Создаём...
              </>
            ) : (
              <>
                <Check size={16} />
                Создать персонажа
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
