'use client'

import { useState } from 'react'
import { CopyResultButton } from './copy-result-button'
import { Dices, Brain } from 'lucide-react'
import { Button, Card, Select } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { generateMadness, type MadnessType, type MadnessResult } from '@/lib/generators/madness'

export function MadnessGenerator() {
  const t = useT()
  const [type, setType] = useState<MadnessType>('short')
  const [result, setResult] = useState<MadnessResult | null>(null)

  const TYPE_OPTIONS = [
    { value: 'short', label: t('generators.madnessType.short') },
    { value: 'long', label: t('generators.madnessType.long') },
    { value: 'indefinite', label: t('generators.madnessType.indefinite') },
  ]

  const handleGenerate = () => {
    setResult(generateMadness(type))
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-40">
            <Select
              label={t('generators.form.madnessType')}
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as MadnessType)}
            />
          </div>
          <Button variant="primary" size="md" icon={<Dices size={16} />} onClick={handleGenerate}>
            {t('generators.generate')}
          </Button>
        </div>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Brain size={18} className="text-[var(--accent-text)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                d100 = {result.roll}
              </h3>
              <span className="text-sm text-[var(--text-muted)]">({result.duration})</span>
            </div>
            <CopyResultButton
              key={`d100 = ${result.roll}: ${result.effect.name} — ${result.effect.description} (${result.duration})`}
              text={`d100 = ${result.roll}: ${result.effect.name} — ${result.effect.description} (${result.duration})`}
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <div className="text-3xl">{result.effect.icon}</div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 font-semibold text-[var(--text-primary)]">
                {result.effect.name}
              </h4>
              <p className="text-sm text-[var(--text-muted)]">{result.effect.description}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
