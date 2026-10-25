'use client'

import { useState } from 'react'
import { Dices, Copy, Check, Swords } from 'lucide-react'
import { Button, Card, Select, Badge } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import {
  generateEncounter,
  type EncounterBiome,
  type EncounterTier,
  type EncounterResult,
  type EncounterDifficulty,
} from '@/lib/generators/encounter'

export function EncounterGenerator() {
  const { t, lang } = useI18n()
  const [biome, setBiome] = useState<EncounterBiome>('forest')
  const [tier, setTier] = useState<EncounterTier>('1-4')
  const [result, setResult] = useState<EncounterResult | null>(null)
  const [copied, setCopied] = useState(false)

  const BIOME_OPTIONS = [
    { value: 'forest', label: t('generators.biome.forest') },
    { value: 'mountains', label: t('generators.biome.mountains') },
    { value: 'swamp', label: t('generators.biome.swamp') },
    { value: 'desert', label: t('generators.biome.desert') },
    { value: 'dungeon', label: t('generators.biome.dungeon') },
    { value: 'city', label: t('generators.biome.city') },
    { value: 'sea', label: t('generators.biome.sea') },
    { value: 'plains', label: t('generators.biome.plains') },
  ]

  const TIER_OPTIONS = [
    { value: '1-4', label: t('generators.tier.1_4') },
    { value: '5-10', label: t('generators.tier.5_10') },
    { value: '11-16', label: t('generators.tier.11_16') },
    { value: '17-20', label: t('generators.tier.17_20') },
  ]

  const DIFFICULTY_LABELS: Record<
    EncounterDifficulty,
    { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' }
  > = {
    easy: { label: t('generators.difficulty.easy'), variant: 'success' },
    medium: { label: t('generators.difficulty.medium'), variant: 'accent' },
    hard: { label: t('generators.difficulty.hard'), variant: 'warning' },
    deadly: { label: t('generators.difficulty.deadly'), variant: 'danger' },
  }

  const handleGenerate = () => {
    // CHANGES: убран ошибочный `const { t, lang } = useI18n()` внутри функции —
    // t и lang уже доступны из замыкания компонента.
    setResult(generateEncounter(biome, tier, lang))
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
            label={t('generators.form.biome')}
            options={BIOME_OPTIONS}
            value={biome}
            onChange={(e) => setBiome(e.target.value as EncounterBiome)}
          />
          <Select
            label={t('generators.form.tier')}
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
              {t('generators.generate')}
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card padding="md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords size={18} className="text-[var(--danger)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {t('generators.encounter.title')}
              </h3>
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
              {copied ? t('generators.copied') : t('generators.copy')}
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
    `⚔️ Encounter (${result.biome}, ${result.tier})`,
    `Difficulty: ${result.difficulty}`,
    '',
    result.description,
    '',
    'Monsters:',
  ]

  result.monsters.forEach((m) => {
    lines.push(`• ${m.name} (CR ${m.cr}) ×${m.count}`)
  })

  return lines.join('\n')
}
