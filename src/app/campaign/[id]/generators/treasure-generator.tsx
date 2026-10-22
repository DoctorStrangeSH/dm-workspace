'use client'

import { useState } from 'react'
import { Dices, Copy, Check } from 'lucide-react'
import { Button, Card, Select } from '@/components/ui'
import { generateTreasure, type TreasureTier, type TreasureResult } from '@/lib/generators/treasure'

const TIER_OPTIONS = [
  { value: '1-4', label: 'Уровни 1–4 (CR 0–4)' },
  { value: '5-10', label: 'Уровни 5–10 (CR 5–10)' },
  { value: '11-16', label: 'Уровни 11–16 (CR 11–16)' },
  { value: '17-20', label: 'Уровни 17–20 (CR 17–20)' },
]

export function TreasureGenerator() {
  const [tier, setTier] = useState<TreasureTier>('1-4')
  const [result, setResult] = useState<TreasureResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    setResult(generateTreasure(tier))
  }

  const handleCopy = async () => {
    if (!result) return
    const text = formatResult(result)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Select
              label="Уровень"
              options={TIER_OPTIONS}
              value={tier}
              onChange={(e) => setTier(e.target.value as TreasureTier)}
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
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Результат</h3>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>

          <div className="space-y-4">
            {/* Монеты */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[var(--text-muted)] uppercase">
                Монеты
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.coins.pp > 0 && (
                  <CoinBadge
                    value={result.coins.pp}
                    label="pp"
                    color="text-[var(--text-secondary)]"
                  />
                )}
                {result.coins.gp > 0 && (
                  <CoinBadge
                    value={result.coins.gp}
                    label="gp"
                    color="text-[var(--warning-text)]"
                  />
                )}
                {result.coins.sp > 0 && (
                  <CoinBadge value={result.coins.sp} label="sp" color="text-[var(--text-muted)]" />
                )}
                {result.coins.cp > 0 && (
                  <CoinBadge value={result.coins.cp} label="cp" color="text-[var(--text-subtle)]" />
                )}
              </div>
            </div>

            {/* Драгоценности */}
            {result.gems.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--text-muted)] uppercase">
                  Драгоценности
                </h4>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {result.gems.map((gem, i) => (
                    <li key={i}>• {gem}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Предметы искусства */}
            {result.art.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--text-muted)] uppercase">
                  Предметы искусства
                </h4>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {result.art.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Магические предметы */}
            {result.magicItems.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--text-muted)] uppercase">
                  Магические предметы
                </h4>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                  {result.magicItems.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Итого */}
            <div className="border-t border-[var(--border-default)] pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Примерная стоимость:</span>
                <span className="font-bold text-[var(--warning-text)]">
                  {result.totalValueGp.toLocaleString('ru-RU')} gp
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function CoinBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span
      className={`rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium ${color}`}
    >
      {value.toLocaleString('ru-RU')} {label}
    </span>
  )
}

function formatResult(result: TreasureResult): string {
  const lines: string[] = ['🎁 Сокровище', '']

  if (result.coins.pp > 0) lines.push(`• ${result.coins.pp} pp`)
  if (result.coins.gp > 0) lines.push(`• ${result.coins.gp} gp`)
  if (result.coins.sp > 0) lines.push(`• ${result.coins.sp} sp`)
  if (result.coins.cp > 0) lines.push(`• ${result.coins.cp} cp`)

  if (result.gems.length > 0) {
    lines.push('', 'Драгоценности:')
    result.gems.forEach((g) => lines.push(`• ${g}`))
  }

  if (result.art.length > 0) {
    lines.push('', 'Предметы искусства:')
    result.art.forEach((a) => lines.push(`• ${a}`))
  }

  if (result.magicItems.length > 0) {
    lines.push('', 'Магические предметы:')
    result.magicItems.forEach((m) => lines.push(`• ${m}`))
  }

  lines.push('', `Итого: ~${result.totalValueGp} gp`)

  return lines.join('\n')
}
