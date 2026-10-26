'use client'

import { useState, useTransition, useEffect } from 'react'
import BestiarySearch from './bestiary-search'
import MonsterCard from './monster-card'
import MonsterDetailDialog from './monster-detail-dialog'
import { EmptyState } from '@/components/ui'
import { searchSrdMonstersAction, type SrdMonster } from '@/lib/actions/bestiary-search'
import { useT } from '@/lib/i18n'
import type { SrdLang } from '@/lib/types'

interface Props {
  campaignId: string
  initialMonsters: SrdMonster[]
  availableCRs: string[]
  canEdit: boolean
  lang: SrdLang
}

export default function BestiaryClient({
  campaignId,
  initialMonsters,
  availableCRs,
  canEdit,
  lang,
}: Props) {
  const t = useT()
  const [monsters, setMonsters] = useState(initialMonsters)
  const [query, setQuery] = useState('')
  const [selectedCRs, setSelectedCRs] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [selectedMonster, setSelectedMonster] = useState<SrdMonster | null>(null)

  const hasFilters = query || selectedCRs.length > 0 || selectedTypes.length > 0

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchSrdMonstersAction({
          query,
          cr: selectedCRs,
          type: selectedTypes,
          limit: 100,
        })
        setMonsters(results)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, selectedCRs, selectedTypes])

  return (
    <>
      <BestiarySearch
        onSearch={setQuery}
        onFilterCR={setSelectedCRs}
        onFilterType={setSelectedTypes}
        availableCRs={availableCRs}
        isPending={isPending}
      />

      <div className="mb-4 flex items-center justify-between gap-2 px-1 text-xs text-[var(--text-muted)]" role="status" aria-live="polite">
        <span>{lang === 'en' ? 'Creatures found' : 'Найдено существ'}: <strong className="font-semibold tabular-nums text-[var(--text-primary)]">{monsters.length}</strong></span>
        {isPending && <span>{lang === 'en' ? 'Searching…' : 'Поиск…'}</span>}
      </div>

      {monsters.length === 0 ? (
        <EmptyState
          icon="🐉"
          title={hasFilters ? t('bestiary.empty.titleFiltered') : t('bestiary.empty.title')}
          description={t('bestiary.empty.description')}
          size="md"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {monsters.map((monster) => (
            <MonsterCard
              key={monster.key}
              monster={monster}
              canEdit={canEdit}
              lang={lang}
              onAdd={() => setSelectedMonster(monster)}
              onView={() => setSelectedMonster(monster)}
            />
          ))}
        </div>
      )}

      {selectedMonster && (
        <MonsterDetailDialog
          monster={selectedMonster}
          campaignId={campaignId}
          canEdit={canEdit}
          onClose={() => setSelectedMonster(null)}
        />
      )}
    </>
  )
}
