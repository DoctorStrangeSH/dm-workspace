'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, Package, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

export type TabKey = 'overview' | 'spells' | 'inventory' | 'features'

interface Props {
  defaultTab?: TabKey
  overviewContent: React.ReactNode
  spellsContent: React.ReactNode
  inventoryContent: React.ReactNode
  featuresContent: React.ReactNode
}

export default function CharacterTabs({
  defaultTab = 'overview',
  overviewContent,
  spellsContent,
  inventoryContent,
  featuresContent,
}: Props) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)

  const TABS: Array<{ key: TabKey; label: string; icon: typeof BookOpen }> = [
    { key: 'overview', label: t('characters.tabs.overview'), icon: BookOpen },
    { key: 'spells', label: t('characters.tabs.spells'), icon: Sparkles },
    { key: 'inventory', label: t('characters.tabs.inventory'), icon: Package },
    { key: 'features', label: t('characters.tabs.features'), icon: Star },
  ]

  const contents: Record<TabKey, React.ReactNode> = {
    overview: overviewContent,
    spells: spellsContent,
    inventory: inventoryContent,
    features: featuresContent,
  }

  return (
    <div>
      <div role="tablist" aria-label={t('nav.mainNavigation')} className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition touch-manipulation sm:min-h-11 sm:px-3 sm:text-sm',
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              )}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words text-center">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div>{contents[activeTab]}</div>
    </div>
  )
}
