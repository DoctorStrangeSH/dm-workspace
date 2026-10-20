'use client'

import { Shield, Zap, Footprints, Eye, Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { cn } from '@/lib/utils'
import { Card, IconButton } from '@/components/ui'

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
      color: 'text-[var(--info-text)]',
    },
    {
      icon: Zap,
      label: 'Инициатива',
      value: formatModifier(initiative),
      color: 'text-[var(--warning-text)]',
      onRoll: onRollInitiative,
    },
    {
      icon: Footprints,
      label: 'Скорость',
      value: `${speed} ft`,
      color: 'text-[var(--success-text)]',
    },
    {
      icon: Eye,
      label: 'Пасс. внимат.',
      value: passivePerception,
      color: 'text-[var(--accent-text)]',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} padding="sm" className="group relative text-center">
            <Icon size={14} className={cn(stat.color, 'mx-auto mb-1')} />
            <div className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
            <div className="text-[10px] text-[var(--text-subtle)] uppercase">{stat.label}</div>
            {stat.onRoll && (
              <IconButton
                variant="ghost"
                size="sm"
                label="Бросок инициативы"
                onClick={stat.onRoll}
                className="absolute top-1.5 right-1.5 opacity-0 transition group-hover:opacity-100"
              >
                <Dices size={10} />
              </IconButton>
            )}
          </Card>
        )
      })}
    </div>
  )
}
