'use client'
import { useState } from 'react'
import SpellsSearch from './spells-search'
import SrdSpellCard from './srd-spell-card'
import SrdSpellDetailDialog from './srd-spell-detail-dialog'
import { searchSrdSpellsPageAction, type SrdSpell } from '@/lib/actions/spells-search'
import { useCatalogSearch } from '@/lib/hooks/use-catalog-search'
import { CatalogResults } from '@/components/catalog-results'
import type { CatalogPage } from '@/lib/srd/catalog-page'
import { useT } from '@/lib/i18n'
import type { SrdLang } from '@/lib/types'
interface Props {
  campaignId: string
  initialPage: CatalogPage<SrdSpell>
  characters: Array<{ id: string; name: string }>
  canEdit: boolean
  lang: SrdLang
}
export default function SpellsClient({
  campaignId,
  initialPage,
  characters,
  canEdit,
  lang,
}: Props) {
  const t = useT()
  const catalog = useCatalogSearch<{ query: string; level: number[]; school: string[] }, SrdSpell>(
    { query: '', level: [], school: [] },
    initialPage,
    searchSrdSpellsPageAction
  )
  const [selected, setSelected] = useState<SrdSpell | null>(null)
  const hasFilters = Object.values(catalog.filters).some((value) =>
    typeof value === 'string' ? value.trim().length > 0 : value.length > 0
  )
  return (
    <>
      <SpellsSearch
        query={catalog.filters.query}
        levels={catalog.filters.level}
        schools={catalog.filters.school}
        onSearch={(query) => catalog.updateFilters({ query }, 300)}
        onFilterLevel={(level) => catalog.updateFilters({ level })}
        onFilterSchool={(school) => catalog.updateFilters({ school })}
      />
      <CatalogResults<SrdSpell>
        {...catalog}
        icon="✨"
        emptyTitle={t(hasFilters ? 'spells.empty.titleFiltered' : 'spells.empty.title')}
        emptyDescription={t('spells.empty.description')}
      >
        {(items) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((spell) => (
              <SrdSpellCard
                key={spell.key}
                spell={spell}
                canAdd={canEdit}
                lang={lang}
                onAdd={() => setSelected(spell)}
                onView={() => setSelected(spell)}
              />
            ))}
          </div>
        )}
      </CatalogResults>
      {selected && (
        <SrdSpellDetailDialog
          spell={selected}
          campaignId={campaignId}
          characters={characters}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
