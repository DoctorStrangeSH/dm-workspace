'use client'

import { useState } from 'react'
import { Dices } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onRoll: (sides: number, count: number, modifier: number) => void
  disabled?: boolean
}

const DICE = [4, 6, 8, 10, 12, 20, 100]

export default function DiceRoller({ onRoll, disabled }: Props) {
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)

  return (
    <div className="border-t border-slate-800 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">Кол-во:</span>
        <input
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="w-14 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center focus:outline-none focus:border-indigo-500"
        />
        <span className="text-slate-500">Мод:</span>
        <input
          type="number"
          value={modifier}
          onChange={(e) => setModifier(Number(e.target.value) || 0)}
          className="w-14 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {DICE.map((sides) => (
          <button
            key={sides}
            onClick={() => onRoll(sides, count, modifier)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded border transition',
              sides === 20
                ? 'bg-violet-950/40 border-violet-800 text-violet-300 hover:bg-violet-950/60'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white',
              'disabled:opacity-50'
            )}
            title={`${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`}
          >
            <Dices size={10} />
            d{sides}
          </button>
        ))}
      </div>
    </div>
  )
}