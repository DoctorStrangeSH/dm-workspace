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

export default function TemplateSelect({
  templates,
  selectedId,
  onSelect,
  type,
}: Props) {
  const available = useMemo(
    () => templates.filter((t) => t.type === type),
    [templates, type]
  )

  if (available.length === 0) return null

  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm text-slate-300 mb-2">
        <Sparkles size={14} className="text-indigo-400" />
        Шаблон
      </label>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {available.map((t) => {
          const isSelected = selectedId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : t)}
              className={cn(
                'flex items-start gap-2 p-2 rounded-lg border text-left transition',
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-600 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              <span className="text-lg shrink-0">{t.icon ?? '📄'}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.name}</div>
                {t.isBuiltin && (
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
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