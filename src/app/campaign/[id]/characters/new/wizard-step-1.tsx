'use client'

import { Input, Select } from '@/components/ui'
import { RACES, CLASSES } from '@/lib/dnd/constants'
import type { SrdSpecies, SrdClass } from '@/lib/queries/srd'

interface Props {
  name: string
  setName: (name: string) => void
  raceSlug: string
  setRaceSlug: (slug: string) => void
  classSlug: string
  setClassSlug: (slug: string) => void
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
  level,
  setLevel,
  species,
  classes,
}: Props) {
  const useDb = species.length > 0 && classes.length > 0

  const raceOptions = useDb
    ? species.map((s) => ({ value: s.key, label: s.name_ru ?? s.name }))
    : RACES.map((r) => ({ value: r.slug, label: r.name }))

  const classOptions = useDb
    ? classes.map((c) => ({ value: c.key, label: c.name_ru ?? c.name }))
    : CLASSES.map((c) => ({ value: c.slug, label: c.name }))

  return (
    <div className="space-y-6">
      <Input
        label="Имя персонажа"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Арагорн"
        autoFocus
        maxLength={150}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Раса"
          value={raceSlug}
          onChange={(e) => setRaceSlug(e.target.value)}
          options={[{ value: '', label: '— Выбери расу —' }, ...raceOptions]}
          required
        />

        <Select
          label="Класс"
          value={classSlug}
          onChange={(e) => setClassSlug(e.target.value)}
          options={[{ value: '', label: '— Выбери класс —' }, ...classOptions]}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
          Уровень
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
          <span className="text-sm text-[var(--text-subtle)]">от 1 до 20</span>
        </div>
      </div>
    </div>
  )
}
