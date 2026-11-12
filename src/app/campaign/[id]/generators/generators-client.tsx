'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Coins, Store, Swords, Sparkles, Brain, WandSparkles } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { TreasureGenerator } from './treasure-generator'
import { ShopGenerator } from './shop-generator'
import { EncounterGenerator } from './encounter-generator'
import { WildMagicGenerator } from './wild-magic-generator'
import { MadnessGenerator } from './madness-generator'

const tools = [
  { key: 'treasure', label: 'treasure', Icon: Coins, Component: TreasureGenerator },
  { key: 'shop', label: 'shop', Icon: Store, Component: ShopGenerator },
  { key: 'encounter', label: 'encounter', Icon: Swords, Component: EncounterGenerator },
  { key: 'wild-magic', label: 'wildMagic', Icon: Sparkles, Component: WildMagicGenerator },
  { key: 'madness', label: 'madness', Icon: Brain, Component: MadnessGenerator },
] as const

export function GeneratorsClient() {
  const t = useT()
  const id = useId()
  const navigation = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  function navigate(event: KeyboardEvent, index: number) {
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tools.length - 1
          : event.key === 'ArrowRight'
            ? (index + 1) % tools.length
            : event.key === 'ArrowLeft'
              ? (index + tools.length - 1) % tools.length
              : null
    if (next === null) return
    event.preventDefault()
    setActive(next)
    navigation.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--accent-subtle)] p-4 sm:p-5">
        <WandSparkles
          size={24}
          className="mt-1 shrink-0 text-[var(--accent-text)]"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {t('generators.workbench.title')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {t('generators.workbench.hint')}
          </p>
        </div>
      </div>
      <div
        ref={navigation}
        role="tablist"
        aria-label={t('generators.workbench.tools')}
        aria-orientation="horizontal"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {tools.map(({ key, label, Icon }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-tab-${key}`}
            aria-controls={`${id}-panel-${key}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => navigate(event, index)}
            className={`min-h-28 min-w-0 rounded-2xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${active === index ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]'}`}
          >
            <Icon size={20} aria-hidden="true" className="mb-2" />
            <span className="block text-sm font-semibold break-words">
              {t('generators.tab.' + label)}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
              {t('generators.workbench.' + label)}
            </span>
          </button>
        ))}
      </div>
      {tools.map(({ key, Component }, index) => (
        <section
          key={key}
          role="tabpanel"
          id={`${id}-panel-${key}`}
          aria-labelledby={`${id}-tab-${key}`}
          hidden={active !== index}
          tabIndex={0}
          className="min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
        >
          <Component />
        </section>
      ))}
    </div>
  )
}
