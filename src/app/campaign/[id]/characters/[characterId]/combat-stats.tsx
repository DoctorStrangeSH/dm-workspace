'use client'

import { Shield, Zap, Footprints, Eye, Dices } from 'lucide-react'
import { formatModifier } from '@/lib/dnd/formulas'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
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
  const t = useT()

  const stats = [
    {
      icon: Shield,
      label: 'AC',
      value: ac,
      color: 'text-[var(--info-text)]',
    },
    {
      icon: Zap,
      label: t('characters.initiative'),
      value: formatModifier(initiative),
      color: 'text-[var(--warning-text)]',
      onRoll: onRollInitiative,
    },
    {
      icon: Footprints,
      label: t('characters.speed'),
      value: t('characters.speedFt', { speed }),
      color: 'text-[var(--success-text)]',
    },
    {
      icon: Eye,
      label: t('characters.passivePerception'),
      value: passivePerception,
      color: 'text-[var(--accent-text)]',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} padding="sm" className="group relative min-h-28 rounded-2xl border-[var(--border-default)] text-center">
            <Icon size={14} className={cn(stat.color, 'mx-auto mb-2')} />
            <div className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">{stat.value}</div>
            <div className="mt-1 text-[10px] font-medium leading-tight text-[var(--text-subtle)] uppercase">{stat.label}</div>
            {stat.onRoll && (
              <IconButton
                variant="ghost"
                size="sm"
                label={t('characters.rollInitiative')}
                onClick={stat.onRoll}
                className="absolute top-1 right-1 opacity-100 transition hover:bg-[var(--bg-hover)] md:opacity-60 md:group-hover:opacity-100 focus-visible:opacity-100"
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
