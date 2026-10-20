'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EntityTemplate, EntityType } from '@/lib/types'

interface Props {
  templates: EntityTemplate[]
  selectedId: string | null
  onSelect: (template: EntityTemplate | null) => void
  type: EntityType
}

export default function TemplateSelect({ templates, selectedId, onSelect, type }: Props) {
  const available = useMemo(() => templates.filter((t) => t.type === type), [templates, type])

  if (available.length === 0) return null

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-sm text-slate-300">
        <Sparkles size={14} className="text-indigo-400" />
        Шаблон
      </label>
      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto">
        {available.map((t) => {
          const isSelected = selectedId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : t)}
              className={cn(
                'flex items-start gap-2 rounded-lg border p-2 text-left transition',
                isSelected
                  ? 'border-indigo-600 bg-indigo-950/60 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
              )}
            >
              <span className="shrink-0 text-lg">{t.icon ?? '📄'}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                {t.isBuiltin && (
                  <div className="text-[10px] tracking-wider text-slate-500 uppercase">
                    Встроенный
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
