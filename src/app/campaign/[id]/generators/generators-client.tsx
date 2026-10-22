'use client'

import { useState } from 'react'
import { Tabs } from '@/components/ui'
import { TreasureGenerator } from './treasure-generator'

const TABS = [
  { value: 'treasure', label: '💰 Сокровища' },
  { value: 'shop', label: '🏪 Магазины' },
  { value: 'encounter', label: '⚔️ Энкаунтеры' },
  { value: 'wild-magic', label: '✨ Wild Magic' },
  { value: 'madness', label: '🌀 Безумие' },
]

interface Props {
  campaignId: string
}

export function GeneratorsClient({ campaignId }: Props) {
  const [tab, setTab] = useState('treasure')

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab} items={TABS} className="mb-6" />

      {tab === 'treasure' && <TreasureGenerator campaignId={campaignId} />}
      {tab === 'shop' && <div className="text-[var(--text-muted)]">Магазины — скоро</div>}
      {tab === 'encounter' && <div className="text-[var(--text-muted)]">Энкаунтеры — скоро</div>}
      {tab === 'wild-magic' && <div className="text-[var(--text-muted)]">Wild Magic — скоро</div>}
      {tab === 'madness' && <div className="text-[var(--text-muted)]">Безумие — скоро</div>}
    </div>
  )
}
