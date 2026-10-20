'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, Package, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabKey = 'overview' | 'spells' | 'inventory' | 'features'

interface Props {
  defaultTab?: TabKey
  overviewContent: React.ReactNode
  spellsContent: React.ReactNode
  inventoryContent: React.ReactNode
  featuresContent: React.ReactNode
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof BookOpen }> = [
  { key: 'overview', label: 'Обзор', icon: BookOpen },
  { key: 'spells', label: 'Заклинания', icon: Sparkles },
  { key: 'inventory', label: 'Инвентарь', icon: Package },
  { key: 'features', label: 'Особенности', icon: Star },
]

export default function CharacterTabs({
  defaultTab = 'overview',
  overviewContent,
  spellsContent,
  inventoryContent,
  featuresContent,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)

  const contents: Record<TabKey, React.ReactNode> = {
    overview: overviewContent,
    spells: spellsContent,
    inventory: inventoryContent,
    features: featuresContent,
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>{contents[activeTab]}</div>
    </div>
  )
}
