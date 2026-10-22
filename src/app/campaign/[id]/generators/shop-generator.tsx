'use client'

import { useState } from 'react'
import { Dices, Copy, Check, Store } from 'lucide-react'
import { Button, Card, Select, Badge } from '@/components/ui'
import { generateShop, type ShopSize, type ShopType, type ShopResult } from '@/lib/generators/shop'

const SIZE_OPTIONS = [
  { value: 'village', label: 'Деревня (до 500)' },
  { value: 'town', label: 'Городок (500–5000)' },
  { value: 'city', label: 'Город (5000–25000)' },
  { value: 'capital', label: 'Столица (25000+)' },
]

const TYPE_OPTIONS = [
  { value: 'blacksmith', label: 'Кузнец (оружие, броня)' },
  { value: 'general', label: 'Общая лавка (снаряжение)' },
  { value: 'alchemist', label: 'Алхимик (зелья)' },
  { value: 'magic', label: 'Магическая лавка' },
  { value: 'temple', label: 'Храм (зелья, свитки)' },
  { value: 'tavern', label: 'Таверна (еда)' },
]

export function ShopGenerator() {
  const [size, setSize] = useState<ShopSize>('town')
  const [type, setType] = useState<ShopType>('general')
  const [result, setResult] = useState<ShopResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    setResult(generateShop(size, type))
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
            label="Размер города"
            options={SIZE_OPTIONS}
            value={size}
            onChange={(e) => setSize(e.target.value as ShopSize)}
          />
          <Select
            label="Тип магазина"
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
              Сгенерировать
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
              {copied ? 'Скопировано' : 'Копировать'}
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
            <span className="text-[var(--text-muted)]">Общая стоимость ассортимента:</span>
            <span className="font-bold text-[var(--warning-text)]">
              {result.totalValueGp.toLocaleString('ru-RU')} gp
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

  lines.push('', `Общая стоимость: ${result.totalValueGp} gp`)

  return lines.join('\n')
}
