'use client'
import { useState } from 'react'
import BestiarySearch from './bestiary-search'
import MonsterCard from './monster-card'
import MonsterDetailDialog from './monster-detail-dialog'
import { searchSrdMonstersPageAction, type SrdMonster } from '@/lib/actions/bestiary-search'
import { useCatalogSearch } from '@/lib/hooks/use-catalog-search'
import { CatalogResults } from '@/components/catalog-results'
import type { CatalogPage } from '@/lib/srd/catalog-page'
import { useT } from '@/lib/i18n'
import type { SrdLang } from '@/lib/types'
interface Props {
  campaignId: string
  initialPage: CatalogPage<SrdMonster>
  availableCRs: string[]
  canEdit: boolean
  lang: SrdLang
}
export default function BestiaryClient({
  campaignId,
  initialPage,
  availableCRs,
  canEdit,
  lang,
}: Props) {
  const t = useT()
  const catalog = useCatalogSearch<{ query: string; cr: string[]; type: string[] }, SrdMonster>(
    { query: '', cr: [], type: [] },
    initialPage,
    searchSrdMonstersPageAction
  )
  const [selected, setSelected] = useState<SrdMonster | null>(null)
  const hasFilters = Object.values(catalog.filters).some((value) =>
    typeof value === 'string' ? value.trim().length > 0 : value.length > 0
  )
  return (
    <>
      <BestiarySearch
        query={catalog.filters.query}
        selectedCRs={catalog.filters.cr}
        selectedTypes={catalog.filters.type}
        availableCRs={availableCRs}
        onSearch={(query) => catalog.updateFilters({ query }, 300)}
        onFilterCR={(cr) => catalog.updateFilters({ cr })}
        onFilterType={(type) => catalog.updateFilters({ type })}
      />
      <CatalogResults<SrdMonster>
        {...catalog}
        icon="🐉"
        emptyTitle={t(hasFilters ? 'bestiary.empty.titleFiltered' : 'bestiary.empty.title')}
        emptyDescription={t('bestiary.empty.description')}
      >
        {(items) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((monster) => (
              <MonsterCard
                key={monster.key}
                monster={monster}
                canEdit={canEdit}
                lang={lang}
                onAdd={() => setSelected(monster)}
                onView={() => setSelected(monster)}
              />
            ))}
          </div>
        )}
      </CatalogResults>
      {selected && (
        <MonsterDetailDialog
          monster={selected}
          campaignId={campaignId}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
