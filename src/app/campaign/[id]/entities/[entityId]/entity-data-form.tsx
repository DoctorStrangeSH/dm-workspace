'use client'

import { useState, useCallback, useMemo } from 'react'
import { updateEntity } from '@/lib/actions/entities'
import { useAutosave } from '@/lib/hooks/use-autosave'
import SaveStatus from '../../chapters/[chapterId]/save-status'
import { ENTITY_SCHEMAS, groupFieldsBySection, type FieldSchema } from '@/lib/entity-schemas'
import TextField from './fields/text-field'
import NumberField from './fields/number-field'
import SelectField from './fields/select-field'
import TextareaField from './fields/textarea-field'
import BooleanField from './fields/boolean-field'
import type { EntityType } from '@/lib/types'

interface Props {
  entityId: string
  campaignId: string
  type: EntityType
  initialData: Record<string, unknown>
  isDm: boolean
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split('.')
  const result = { ...obj }
  let current: Record<string, unknown> = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const existing = current[key]
    if (existing && typeof existing === 'object') {
      current[key] = { ...(existing as Record<string, unknown>) }
    } else {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return result
}

export default function EntityDataForm({ entityId, campaignId, type, initialData, isDm }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initialData)

  // CHANGES: schema и sections вычисляются через useMemo с зависимостью от type.
  // Раньше `ENTITY_SCHEMAS[type] ?? []` создавал новый [] каждый рендер,
  // из-за чего useMemo(sections) пересчитывался всегда.
  const schema = useMemo(() => ENTITY_SCHEMAS[type] ?? [], [type])
  const sections = useMemo(() => groupFieldsBySection(schema), [schema])

  const handleSave = useCallback(
    async (value: Record<string, unknown>) => {
      return updateEntity(entityId, campaignId, {
        data_json: value,
      })
    },
    [entityId, campaignId]
  )

  const { status, lastSaved, error } = useAutosave({
    value: data,
    onSave: handleSave,
    delay: 1000,
    enabled: isDm,
  })

  const handleFieldChange = useCallback((fieldKey: string, value: unknown) => {
    setData((prev) => setNestedValue(prev, fieldKey, value))
  }, [])

  if (schema.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Характеристики</h2>
        {isDm && <SaveStatus status={status} lastSaved={lastSaved} error={error} />}
      </div>

      <div className="space-y-6">
        {Object.entries(sections).map(([sectionName, fields]) => (
          <div key={sectionName}>
            {Object.keys(sections).length > 1 && (
              <h3 className="mb-3 text-sm font-medium tracking-wider text-slate-400 uppercase">
                {sectionName}
              </h3>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={getNestedValue(data, field.key)}
                  onChange={(v) => handleFieldChange(field.key, v)}
                  disabled={!isDm}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldSchema
  value: unknown
  onChange: (v: unknown) => void
  disabled: boolean
}) {
  if (field.type === 'textarea') {
    return (
      <div className="md:col-span-2">
        <TextareaField
          label={field.label}
          hint={field.hint}
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      </div>
    )
  }

  if (field.type === 'boolean') {
    return (
      <BooleanField
        label={field.label}
        hint={field.hint}
        value={Boolean(value)}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'select' && field.options) {
    return (
      <SelectField
        label={field.label}
        hint={field.hint}
        value={value as string | undefined}
        onChange={onChange}
        options={field.options}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'number') {
    return (
      <NumberField
        label={field.label}
        hint={field.hint}
        value={value as number | undefined}
        onChange={onChange}
        placeholder={field.placeholder}
        disabled={disabled}
        min={field.min}
        max={field.max}
      />
    )
  }

  return (
    <TextField
      label={field.label}
      hint={field.hint}
      value={(value as string) ?? ''}
      onChange={onChange}
      placeholder={field.placeholder}
      disabled={disabled}
    />
  )
}
