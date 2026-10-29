'use client'

import { Input, Select } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { characterClassName, characterSpeciesName } from '@/lib/dnd/character-display-names'
import { RACES, CLASSES } from '@/lib/dnd/constants'
import {
  isSrdBaseClass,
  baseClassSlug,
  SRD_SUBCLASS_BASE,
  subclassDisplayName,
} from '@/lib/dnd/srd-class-utils'
import type { SrdSpecies, SrdClass } from '@/lib/queries/srd'

interface Props {
  name: string
  setName: (name: string) => void
  raceSlug: string
  setRaceSlug: (slug: string) => void
  classSlug: string
  setClassSlug: (slug: string) => void
  subclassSlug: string
  setSubclassSlug: (slug: string) => void
  level: number
  setLevel: (level: number) => void
  species: SrdSpecies[]
  classes: SrdClass[]
}

export default function WizardStep1({
  name,
  setName,
  raceSlug,
  setRaceSlug,
  classSlug,
  setClassSlug,
  subclassSlug,
  setSubclassSlug,
  level,
  setLevel,
  species,
  classes,
}: Props) {
  const { t, lang } = useI18n()

  const raceOptions =
    species.length > 0
      ? species.map((s) => ({
          value: s.key,
          label: characterSpeciesName(s.key, lang, lang === 'ru' ? s.name_ru || s.name : s.name),
        }))
      : RACES.map((r) => ({ value: r.slug, label: characterSpeciesName(r.slug, lang) }))

  const baseClasses = classes.filter((c) => isSrdBaseClass(c.key))
  const classOptions =
    baseClasses.length > 0
      ? baseClasses.map((c) => ({
          value: c.key,
          label: characterClassName(c.key, lang, lang === 'ru' ? c.name_ru || c.name : c.name),
        }))
      : CLASSES.map((c) => ({ value: c.slug, label: characterClassName(c.slug, lang) }))

  const subclassOptions = Object.entries(SRD_SUBCLASS_BASE)
    .filter(([, base]) => base === baseClassSlug(classSlug))
    .map(([key]) => ({ value: key, label: subclassDisplayName(key, lang) }))

  return (
    <div className="space-y-6">
      <Input
        label={t('characters.wizard.name')}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('characters.wizard.namePlaceholder')}
        autoFocus
        maxLength={150}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label={t('characters.wizard.race')}
          value={raceSlug}
          onChange={(e) => setRaceSlug(e.target.value)}
          options={[{ value: '', label: t('characters.wizard.racePlaceholder') }, ...raceOptions]}
          required
        />

        <Select
          label={t('characters.wizard.class')}
          value={classSlug}
          onChange={(e) => setClassSlug(e.target.value)}
          options={[{ value: '', label: t('characters.wizard.classPlaceholder') }, ...classOptions]}
          required
        />
      </div>

      {classSlug && subclassOptions.length > 0 && (
        <Select
          label={t('characters.subclass')}
          value={subclassSlug}
          onChange={(e) => setSubclassSlug(e.target.value)}
          options={[{ value: '', label: t('characters.noSubclass') }, ...subclassOptions]}
        />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
          {t('characters.wizard.level')}
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => setLevel(Math.min(20, Math.max(1, Number(e.target.value))))}
            className="w-24"
          />
          <span className="text-sm text-[var(--text-subtle)]">
            {t('characters.wizard.levelRange')}
          </span>
        </div>
      </div>
    </div>
  )
}
