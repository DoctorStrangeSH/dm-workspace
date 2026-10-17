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
        <label className="block text-sm text-slate-300 mb-2">
          Имя персонажа <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Арагорн"
          autoFocus
          maxLength={150}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Раса <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {raceOptions.map((race) => (
              <button
                key={race.value}
                type="button"
                onClick={() => setRaceSlug(race.value)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition text-left',
                  raceSlug === race.value
                    ? 'bg-indigo-950/60 border-indigo-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                )}
              >
                {race.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Класс <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {classOptions.map((cls) => (
              <button
                key={cls.value}
                type="button"
                onClick={() => setClassSlug(cls.value)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition text-left',
                  classSlug === cls.value
                    ? 'bg-indigo-950/60 border-indigo-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                )}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">Уровень</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) =>
              setLevel(Math.min(20, Math.max(1, Number(e.target.value))))
            }
            className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <span className="text-sm text-slate-500">от 1 до 20</span>
        </div>
      </div>
    </div>
  )
}