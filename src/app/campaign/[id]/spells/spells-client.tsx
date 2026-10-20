'use client'

import { useState, useEffect, useTransition } from 'react'
import SpellsSearch from './spells-search'
import SrdSpellCard from './srd-spell-card'
import SrdSpellDetailDialog from './srd-spell-detail-dialog'
import { EmptyState } from '@/components/ui'
import { searchSrdSpellsAction, type SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  campaignId: string
  initialSpells: SrdSpell[]
  characters: Array<{ id: string; name: string }>
  canEdit: boolean
}

export default function SpellsClient({ campaignId, initialSpells, characters, canEdit }: Props) {
  const [spells, setSpells] = useState(initialSpells)
  const [query, setQuery] = useState('')
  const [levels, setLevels] = useState<number[]>([])
  const [schools, setSchools] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [selectedSpell, setSelectedSpell] = useState<SrdSpell | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchSrdSpellsAction({
          query,
          level: levels,
          school: schools,
          limit: 100,
        })
        setSpells(results)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, levels, schools])

  return (
    <>
      <SpellsSearch
        onSearch={setQuery}
        onFilterLevel={setLevels}
        onFilterSchool={setSchools}
        isPending={isPending}
      />

      {spells.length === 0 ? (
        <EmptyState
          icon="✨"
          title={
            query || levels.length > 0 || schools.length > 0
              ? 'Ничего не найдено'
              : 'Заклинаний пока нет'
          }
          description="Попробуй изменить фильтры или поиск"
          size="md"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spells.map((spell) => (
            <SrdSpellCard
              key={spell.key}
              spell={spell}
              canAdd={canEdit}
              onAdd={() => setSelectedSpell(spell)}
              onView={() => setSelectedSpell(spell)}
            />
          ))}
        </div>
      )}

      {selectedSpell && (
        <SrdSpellDetailDialog
          spell={selectedSpell}
          campaignId={campaignId}
          characters={characters}
          onClose={() => setSelectedSpell(null)}
        />
      )}
    </>
  )
}
