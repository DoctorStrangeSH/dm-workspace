'use client'

import { useState } from 'react'
import { Tabs } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { TreasureGenerator } from './treasure-generator'
import { ShopGenerator } from './shop-generator'
import { EncounterGenerator } from './encounter-generator'
import { WildMagicGenerator } from './wild-magic-generator'
import { MadnessGenerator } from './madness-generator'

export function GeneratorsClient() {
  const t = useT()
  const [tab, setTab] = useState('treasure')

  const TABS = [
    { value: 'treasure', label: `💰 ${t('generators.tab.treasure')}` },
    { value: 'shop', label: `🏪 ${t('generators.tab.shop')}` },
    { value: 'encounter', label: `⚔️ ${t('generators.tab.encounter')}` },
    { value: 'wild-magic', label: `✨ ${t('generators.tab.wildMagic')}` },
    { value: 'madness', label: `🌀 ${t('generators.tab.madness')}` },
  ]

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
