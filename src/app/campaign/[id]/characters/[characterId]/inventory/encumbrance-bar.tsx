'use client'

import { Weight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  currentWeight: number
  capacity: number
}

export default function EncumbranceBar({ currentWeight, capacity }: Props) {
  const percent = capacity > 0 ? (currentWeight / capacity) * 100 : 0
  const isOverloaded = currentWeight > capacity
  const isEncumbered = currentWeight > capacity * 0.67
  const isHeavilyEncumbered = currentWeight > capacity * 0.83

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Weight size={16} className="text-slate-400" />
          <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Вес</span>
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            isOverloaded
              ? 'text-red-400'
              : isHeavilyEncumbered
                ? 'text-red-300'
                : isEncumbered
                  ? 'text-amber-400'
                  : 'text-slate-300'
          )}
        >
          {currentWeight.toFixed(1)} / {capacity} lbs
        </span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full border border-slate-800 bg-slate-950">
        <div
          className={cn(
            'h-full transition-all',
            isOverloaded
              ? 'bg-red-600'
              : isHeavilyEncumbered
                ? 'bg-red-500'
                : isEncumbered
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {(isEncumbered || isOverloaded) && (
        <p className="mt-2 text-xs text-amber-400">
          {isOverloaded ? '🚫 Перегрузка — скорость 0' : '⚠️ Перегрузка — скорость −10 футов'}
        </p>
      )}
    </div>
  )
}
