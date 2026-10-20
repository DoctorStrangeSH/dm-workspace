'use client'

import { cn } from '@/lib/utils'
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
  // Fallback на хардкод, если БД пустая
  const useDb = species.length > 0 && classes.length > 0

  // Опции для рас
  const raceOptions = useDb
    ? species.map((s) => ({
        value: s.key,
        label: s.name_ru ?? s.name,
      }))
    : RACES.map((r) => ({
        value: r.slug,
        label: r.name,
      }))

  // Опции для классов
  const classOptions = useDb
    ? classes.map((c) => ({
        value: c.key,
        label: c.name_ru ?? c.name,
      }))
    : CLASSES.map((c) => ({
        value: c.slug,
        label: c.name,
      }))

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Имя персонажа <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Арагорн"
          autoFocus
          maxLength={150}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Раса <span className="text-red-400">*</span>
          </label>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto">
            {raceOptions.map((race) => (
              <button
                key={race.value}
                type="button"
                onClick={() => setRaceSlug(race.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition',
                  raceSlug === race.value
                    ? 'border-indigo-600 bg-indigo-950/60 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                )}
              >
                {race.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Класс <span className="text-red-400">*</span>
          </label>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto">
            {classOptions.map((cls) => (
              <button
                key={cls.value}
                type="button"
                onClick={() => setClassSlug(cls.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition',
                  classSlug === cls.value
                    ? 'border-indigo-600 bg-indigo-950/60 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                )}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">Уровень</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => setLevel(Math.min(20, Math.max(1, Number(e.target.value))))}
            className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-sm text-slate-500">от 1 до 20</span>
        </div>
      </div>
    </div>
  )
}
