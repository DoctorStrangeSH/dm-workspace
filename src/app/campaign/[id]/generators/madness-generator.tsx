'use client'

import { useState } from 'react'
import { Dices, Copy, Check, Brain } from 'lucide-react'
import { Button, Card, Select } from '@/components/ui'
import { generateMadness, type MadnessType, type MadnessResult } from '@/lib/generators/madness'

const TYPE_OPTIONS = [
  { value: 'short', label: 'Краткосрочное (1d10 минут)' },
  { value: 'long', label: 'Долгосрочное (1d10 × 10 часов)' },
  { value: 'indefinite', label: 'Бессрочное (навсегда)' },
]

export function MadnessGenerator() {
  const [type, setType] = useState<MadnessType>('short')
  const [result, setResult] = useState<MadnessResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    setResult(generateMadness(type))
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(
      `d100 = ${result.roll}: ${result.effect.name} — ${result.effect.description} (${result.duration})`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Select
              label="Тип безумия"
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as MadnessType)}
            />
          </div>
          <Button variant="primary" size="md" icon={<Dices size={16} />} onClick={handleGenerate}>
            Сгенерировать
          </Button>
        </div>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-[var(--accent-text)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                d100 = {result.roll}
              </h3>
              <span className="text-sm text-[var(--text-muted)]">({result.duration})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
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
