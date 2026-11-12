'use client'

import { useState } from 'react'
import { CopyResultButton } from './copy-result-button'
import { Dices, Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { generateWildMagic, type WildMagicResult } from '@/lib/generators/wild-magic'

export function WildMagicGenerator() {
  const t = useT()
  const [result, setResult] = useState<WildMagicResult | null>(null)

  const handleGenerate = () => {
    setResult(generateWildMagic())
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
          {t('generators.wildMagic.roll')}
        </Button>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Sparkles size={18} className="text-[var(--accent-text)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                d100 = {result.roll}
              </h3>
            </div>
            <CopyResultButton
              key={`d100 = ${result.roll}: ${result.effect.name} — ${result.effect.description}`}
              text={`d100 = ${result.roll}: ${result.effect.name} — ${result.effect.description}`}
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
