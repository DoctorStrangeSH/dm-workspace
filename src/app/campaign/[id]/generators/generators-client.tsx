'use client'

import { useState } from 'react'
import { Tabs } from '@/components/ui'
import { TreasureGenerator } from './treasure-generator'
import { ShopGenerator } from './shop-generator'
import { EncounterGenerator } from './encounter-generator'
import { WildMagicGenerator } from './wild-magic-generator'
import { MadnessGenerator } from './madness-generator'

const TABS = [
  { value: 'treasure', label: '💰 Сокровища' },
  { value: 'shop', label: '🏪 Магазины' },
  { value: 'encounter', label: '⚔️ Энкаунтеры' },
  { value: 'wild-magic', label: '✨ Wild Magic' },
  { value: 'madness', label: '🌀 Безумие' },
]

export function GeneratorsClient() {
  const [tab, setTab] = useState('treasure')

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab} items={TABS} className="mb-6" />

      {tab === 'treasure' && <TreasureGenerator />}
      {tab === 'shop' && <ShopGenerator />}
      {tab === 'encounter' && <EncounterGenerator />}
      {tab === 'wild-magic' && <WildMagicGenerator />}
      {tab === 'madness' && <MadnessGenerator />}
    </div>
  )
}
