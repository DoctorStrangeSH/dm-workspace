'use client'

import { Shield, Zap, Footprints, Eye, Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { cn } from '@/lib/utils'

interface Props {
  ac: number
  initiative: number
  speed: number
  passivePerception: number
  onRollInitiative?: () => void
}

export default function CombatStats({
  ac,
  initiative,
  speed,
  passivePerception,
  onRollInitiative,
}: Props) {
  const stats = [
    {
      icon: Shield,
      label: 'AC',
      value: ac,
      color: 'text-sky-400',
    },
    {
      icon: Zap,
      label: 'Инициатива',
      value: formatModifier(initiative),
      color: 'text-amber-400',
      onRoll: onRollInitiative,
    },
    {
      icon: Footprints,
      label: 'Скорость',
      value: `${speed} ft`,
      color: 'text-emerald-400',
    },
    {
      icon: Eye,
      label: 'Пасс. внимат.',
      value: passivePerception,
      color: 'text-violet-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="group relative bg-slate-900 border border-slate-800 rounded-xl p-3 text-center"
          >
            <Icon size={14} className={cn(stat.color, 'mx-auto mb-1')} />
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-[10px] text-slate-500 uppercase">
              {stat.label}
            </div>
            {stat.onRoll && (
              <button
                type="button"
                onClick={stat.onRoll}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition"
                title="Бросок инициативы"
              >
                <Dices size={10} className="text-slate-400" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}