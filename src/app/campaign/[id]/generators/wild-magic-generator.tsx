'use client'

import { useState } from 'react'
import { Dices, Copy, Check, Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { generateWildMagic, type WildMagicResult } from '@/lib/generators/wild-magic'

export function WildMagicGenerator() {
  const [result, setResult] = useState<WildMagicResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    setResult(generateWildMagic())
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(
      `d100 = ${result.roll}: ${result.effect.name} — ${result.effect.description}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <Button
          variant="primary"
          size="md"
          icon={<Dices size={16} />}
          onClick={handleGenerate}
          className="w-full"
        >
          Бросить d100
        </Button>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--accent-text)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                d100 = {result.roll}
              </h3>
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
