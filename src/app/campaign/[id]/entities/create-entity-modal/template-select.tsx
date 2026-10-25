'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { EntityTemplate, EntityType } from '@/lib/types'

interface Props {
  templates: EntityTemplate[]
  selectedId: string | null
  onSelect: (template: EntityTemplate | null) => void
  type: EntityType
}

export default function TemplateSelect({ templates, selectedId, onSelect, type }: Props) {
  const t = useT()
  const available = useMemo(() => templates.filter((tpl) => tpl.type === type), [templates, type])

  if (available.length === 0) return null

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
        <Sparkles size={14} className="text-[var(--accent-text)]" />
        {t('entities.template.label')}
      </label>
      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto">
        {available.map((tpl) => {
          const isSelected = selectedId === tpl.id
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : tpl)}
              className={cn(
                'flex items-start gap-2 rounded-lg border p-2 text-left transition',
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
              )}
            >
              <span className="shrink-0 text-lg">{tpl.icon ?? '📄'}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{tpl.name}</div>
                {tpl.isBuiltin && (
                  <div className="text-[10px] tracking-wider text-[var(--text-subtle)] uppercase">
                    {t('entities.template.builtin')}
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
