'use client'

import { useState } from 'react'
import { Dices, Copy, Check } from 'lucide-react'
import { Button, Card, Select } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { generateTreasure, type TreasureTier, type TreasureResult } from '@/lib/generators/treasure'

export function TreasureGenerator() {
  const { t, lang } = useI18n()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const [tier, setTier] = useState<TreasureTier>('1-4')
  const [result, setResult] = useState<TreasureResult | null>(null)
  const [copied, setCopied] = useState(false)

  const TIER_OPTIONS = [
    { value: '1-4', label: t('generators.tier.1_4') },
    { value: '5-10', label: t('generators.tier.5_10') },
    { value: '11-16', label: t('generators.tier.11_16') },
    { value: '17-20', label: t('generators.tier.17_20') },
  ]

  const handleGenerate = () => {
    // CHANGES (К8): передаём lang — контент на нужном языке
    setResult(generateTreasure(tier, lang))
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
              label={t('generators.form.tier')}
              options={TIER_OPTIONS}
              value={tier}
              onChange={(e) => setTier(e.target.value as TreasureTier)}
            />
          </div>
          <Button variant="primary" size="md" icon={<Dices size={16} />} onClick={handleGenerate}>
            {t('generators.generate')}
          </Button>
        </div>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('generators.treasure.result')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? t('generators.copied') : t('generators.copy')}
            </Button>
          </div>

          <div className="space-y-4">
            {/* Монеты */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[var(--text-muted)] uppercase">
                {t('generators.treasure.coins')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.coins.pp > 0 && (
                  <CoinBadge
                    value={result.coins.pp}
                    label="pp"
                    color="text-[var(--text-secondary)]"
                    locale={locale}
                  />
                )}
                {result.coins.gp > 0 && (
                  <CoinBadge
                    value={result.coins.gp}
                    label="gp"
                    color="text-[var(--warning-text)]"
                    locale={locale}
                  />
                )}
                {result.coins.sp > 0 && (
                  <CoinBadge
                    value={result.coins.sp}
                    label="sp"
                    color="text-[var(--text-muted)]"
                    locale={locale}
                  />
                )}
                {result.coins.cp > 0 && (
                  <CoinBadge
                    value={result.coins.cp}
                    label="cp"
                    color="text-[var(--text-subtle)]"
                    locale={locale}
                  />
                )}
              </div>
            </div>

            {/* Драгоценности */}
            {result.gems.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--text-muted)] uppercase">
                  {t('generators.treasure.gems')}
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
                  {t('generators.treasure.art')}
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
                  {t('generators.treasure.magicItems')}
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
                <span className="text-[var(--text-muted)]">
                  {t('generators.treasure.totalValue')}
                </span>
                <span className="font-bold text-[var(--warning-text)]">
                  {result.totalValueGp.toLocaleString(locale)} gp
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function CoinBadge({
  value,
  label,
  color,
  locale,
}: {
  value: number
  label: string
  color: string
  locale: string
}) {
  return (
    <span
      className={`rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium ${color}`}
    >
      {value.toLocaleString(locale)} {label}
    </span>
  )
}

function formatResult(result: TreasureResult): string {
  const lines: string[] = ['🎁 Treasure', '']

  if (result.coins.pp > 0) lines.push(`• ${result.coins.pp} pp`)
  if (result.coins.gp > 0) lines.push(`• ${result.coins.gp} gp`)
  if (result.coins.sp > 0) lines.push(`• ${result.coins.sp} sp`)
  if (result.coins.cp > 0) lines.push(`• ${result.coins.cp} cp`)

  if (result.gems.length > 0) {
    lines.push('', 'Gems:')
    result.gems.forEach((g) => lines.push(`• ${g}`))
  }

  if (result.art.length > 0) {
    lines.push('', 'Art objects:')
    result.art.forEach((a) => lines.push(`• ${a}`))
  }

  if (result.magicItems.length > 0) {
    lines.push('', 'Magic items:')
    result.magicItems.forEach((m) => lines.push(`• ${m}`))
  }

  lines.push('', `Total: ~${result.totalValueGp} gp`)

  return lines.join('\n')
}
