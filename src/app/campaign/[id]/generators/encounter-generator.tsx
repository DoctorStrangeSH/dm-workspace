'use client'

import { useState } from 'react'
import { Dices, Copy, Check, Swords } from 'lucide-react'
import { Button, Card, Select, Badge } from '@/components/ui'
import {
  generateEncounter,
  type EncounterBiome,
  type EncounterTier,
  type EncounterResult,
  type EncounterDifficulty,
} from '@/lib/generators/encounter'

const BIOME_OPTIONS = [
  { value: 'forest', label: 'Лес' },
  { value: 'mountains', label: 'Горы' },
  { value: 'swamp', label: 'Болото' },
  { value: 'desert', label: 'Пустыня' },
  { value: 'dungeon', label: 'Подземелье' },
  { value: 'city', label: 'Город' },
  { value: 'sea', label: 'Море' },
  { value: 'plains', label: 'Равнины' },
]

const TIER_OPTIONS = [
  { value: '1-4', label: 'Уровни 1–4' },
  { value: '5-10', label: 'Уровни 5–10' },
  { value: '11-16', label: 'Уровни 11–16' },
  { value: '17-20', label: 'Уровни 17–20' },
]

const DIFFICULTY_LABELS: Record<
  EncounterDifficulty,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' }
> = {
  easy: { label: 'Лёгкий', variant: 'success' },
  medium: { label: 'Средний', variant: 'accent' },
  hard: { label: 'Сложный', variant: 'warning' },
  deadly: { label: 'Смертельный', variant: 'danger' },
}

export function EncounterGenerator() {
  const [biome, setBiome] = useState<EncounterBiome>('forest')
  const [tier, setTier] = useState<EncounterTier>('1-4')
  const [result, setResult] = useState<EncounterResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    setResult(generateEncounter(biome, tier))
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(formatResult(result))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Биом"
            options={BIOME_OPTIONS}
            value={biome}
            onChange={(e) => setBiome(e.target.value as EncounterBiome)}
          />
          <Select
            label="Уровень"
            options={TIER_OPTIONS}
            value={tier}
            onChange={(e) => setTier(e.target.value as EncounterTier)}
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
              <Swords size={18} className="text-[var(--danger)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Энкаунтер</h3>
              <Badge variant={DIFFICULTY_LABELS[result.difficulty].variant} size="md">
                {DIFFICULTY_LABELS[result.difficulty].label}
              </Badge>
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

          <p className="mb-4 text-sm text-[var(--text-muted)] italic">{result.description}</p>

          <div className="space-y-2">
            {result.monsters.map((monster, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--text-primary)]">
                    {monster.name}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">CR {monster.cr}</div>
                </div>
                <Badge variant="danger" size="md">
                  ×{monster.count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function formatResult(result: EncounterResult): string {
  const lines: string[] = [
    `⚔️ Энкаунтер (${result.biome}, ${result.tier})`,
    `Сложность: ${result.difficulty}`,
    '',
    result.description,
    '',
    'Монстры:',
  ]

  result.monsters.forEach((m) => {
    lines.push(`• ${m.name} (CR ${m.cr}) ×${m.count}`)
  })

  return lines.join('\n')
}
