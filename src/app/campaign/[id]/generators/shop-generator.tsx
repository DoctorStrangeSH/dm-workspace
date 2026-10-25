'use client'

import { useState } from 'react'
import { Dices, Copy, Check, Store } from 'lucide-react'
import { Button, Card, Select, Badge } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { generateShop, type ShopSize, type ShopType, type ShopResult } from '@/lib/generators/shop'

export function ShopGenerator() {
  const { t, lang } = useI18n()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const [size, setSize] = useState<ShopSize>('town')
  const [type, setType] = useState<ShopType>('general')
  const [result, setResult] = useState<ShopResult | null>(null)
  const [copied, setCopied] = useState(false)

  const SIZE_OPTIONS = [
    { value: 'village', label: t('generators.shopSize.village') },
    { value: 'town', label: t('generators.shopSize.town') },
    { value: 'city', label: t('generators.shopSize.city') },
    { value: 'capital', label: t('generators.shopSize.capital') },
  ]

  const TYPE_OPTIONS = [
    { value: 'blacksmith', label: t('generators.shopType.blacksmith') },
    { value: 'general', label: t('generators.shopType.general') },
    { value: 'alchemist', label: t('generators.shopType.alchemist') },
    { value: 'magic', label: t('generators.shopType.magic') },
    { value: 'temple', label: t('generators.shopType.temple') },
    { value: 'tavern', label: t('generators.shopType.tavern') },
  ]

  const handleGenerate = () => {
    // CHANGES (К8): передаём lang — контент на нужном языке
    setResult(generateShop(size, type, lang))
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label={t('generators.form.shopSize')}
            options={SIZE_OPTIONS}
            value={size}
            onChange={(e) => setSize(e.target.value as ShopSize)}
          />
          <Select
            label={t('generators.form.shopType')}
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value as ShopType)}
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              icon={<Dices size={16} />}
              onClick={handleGenerate}
              className="w-full"
            >
              {t('generators.generate')}
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-[var(--accent-text)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {result.description}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? t('generators.copied') : t('generators.copy')}
            </Button>
          </div>

          <div className="space-y-2">
            {result.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--text-primary)]">{item.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.category}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="neutral" size="sm">
                    ×{item.quantity}
                  </Badge>
                  <span className="font-bold text-[var(--warning-text)]">
                    {item.price.toFixed(2)} gp
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-default)] pt-3 text-sm">
            <span className="text-[var(--text-muted)]">{t('generators.shop.totalValue')}</span>
            <span className="font-bold text-[var(--warning-text)]">
              {result.totalValueGp.toLocaleString(locale)} gp
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}

function formatResult(result: ShopResult): string {
  const lines: string[] = [`🏪 ${result.description}`, '']

  result.items.forEach((item) => {
    lines.push(`• ${item.name} ×${item.quantity} — ${item.price.toFixed(2)} gp (${item.category})`)
  })

  lines.push('', `Total: ${result.totalValueGp} gp`)

  return lines.join('\n')
}
