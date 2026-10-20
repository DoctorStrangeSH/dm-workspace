'use client'

import { useState, useTransition, useEffect } from 'react'
import BestiarySearch from './bestiary-search'
import MonsterCard from './monster-card'
import MonsterDetailDialog from './monster-detail-dialog'
import EmptyState from '@/components/empty-state'
import { searchSrdMonstersAction, type SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  campaignId: string
  initialMonsters: SrdMonster[]
  availableCRs: string[]
  canEdit: boolean
}

export default function BestiaryClient({
  campaignId,
  initialMonsters,
  availableCRs,
  canEdit,
}: Props) {
  const [monsters, setMonsters] = useState(initialMonsters)
  const [query, setQuery] = useState('')
  const [selectedCRs, setSelectedCRs] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [selectedMonster, setSelectedMonster] = useState<SrdMonster | null>(null)

  // Поиск с фильтрами
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

      {monsters.length === 0 ? (
        <EmptyState
          icon="🐉"
          title={
            query || selectedCRs.length > 0 || selectedTypes.length > 0
              ? 'Ничего не найдено'
              : 'Монстров пока нет'
          }
          description="Попробуй изменить фильтры или поиск"
          size="md"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monsters.map((monster) => (
            <MonsterCard
              key={monster.key}
              monster={monster}
              canEdit={canEdit}
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
