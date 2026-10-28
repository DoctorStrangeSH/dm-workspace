'use client'

import { useRef, useState } from 'react'
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

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

  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab)

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % TABS.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + TABS.length) % TABS.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = TABS.length - 1
    if (nextIndex === undefined) return

    event.preventDefault()
    const nextTab = TABS[nextIndex]
    setActiveTab(nextTab.key)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={t('characters.tabs.overview')}
        className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {TABS.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          const tabId = `character-tab-${tab.key}`
          return (
            <button
              key={tab.key}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="character-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
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

      <div id="character-tabpanel" role="tabpanel" aria-labelledby={`character-tab-${activeTab}`} tabIndex={0}>
        {contents[activeTab]}
      </div>
    </div>
  )
}
