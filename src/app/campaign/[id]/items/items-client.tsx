'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import ItemsSearch from './items-search'
import SrdItemCard from './srd-item-card'
import SrdItemDetailDialog from './srd-item-detail-dialog'
import { Button, EmptyState } from '@/components/ui'
import {
  searchSrdItemsPageAction,
  type SrdItem,
  type SrdItemsPageResult,
} from '@/lib/actions/items-search'
import { ITEM_PAGE_SIZE } from '@/lib/item-catalog'
import { useT } from '@/lib/i18n'
import type { SrdLang } from '@/lib/types'

interface Props {
  campaignId: string
  initialPage: SrdItemsPageResult
  characters: Array<{ id: string; name: string }>
  availableTypes: string[]
  availableRarities: string[]
  canEditCampaign: boolean
  lang: SrdLang
}

export default function ItemsClient({
  campaignId,
  initialPage,
  characters,
  availableTypes,
  availableRarities,
  canEditCampaign,
  lang,
}: Props) {
  const t = useT()
  const [request, setRequest] = useState({
    query: '',
    types: [] as string[],
    rarities: [] as string[],
    page: 0,
    revision: 0,
    delay: 0,
  })
  const [response, setResponse] = useState({ revision: 0, result: initialPage })
  const [selectedItem, setSelectedItem] = useState<SrdItem | null>(null)
  const resultsTop = useRef<HTMLDivElement>(null)
  const isPending = response.revision !== request.revision
  const result = response.result
  const hasFilters = Boolean(
    request.query.trim() || request.types.length || request.rarities.length
  )

  useEffect(() => {
    if (request.revision === 0) return // The initial page was already rendered by the server.
    let active = true
    const timer = setTimeout(async () => {
      let result: SrdItemsPageResult
      try {
        result = await searchSrdItemsPageAction(
          {
            query: request.query,
            type: request.types,
            rarity: request.rarities,
          },
          request.page * ITEM_PAGE_SIZE
        )
      } catch {
        result = { ok: false }
      }
      if (active) setResponse({ revision: request.revision, result })
    }, request.delay)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [request])

  const changePage = (page: number) => {
    setRequest((current) => ({ ...current, page, revision: current.revision + 1, delay: 0 }))
    resultsTop.current?.scrollIntoView({ block: 'start' })
    resultsTop.current?.focus({ preventScroll: true })
  }

  return (
    <>
      <ItemsSearch
        query={request.query}
        types={request.types}
        rarities={request.rarities}
        onSearch={(query) =>
          setRequest((current) => ({
            ...current,
            query,
            page: 0,
            revision: current.revision + 1,
            delay: 300,
          }))
        }
        onFilterType={(types) =>
          setRequest((current) => ({
            ...current,
            types,
            page: 0,
            revision: current.revision + 1,
            delay: 0,
          }))
        }
        onFilterRarity={(rarities) =>
          setRequest((current) => ({
            ...current,
            rarities,
            page: 0,
            revision: current.revision + 1,
            delay: 0,
          }))
        }
        availableTypes={availableTypes}
        availableRarities={availableRarities}
      />

      <div
        ref={resultsTop}
        tabIndex={-1}
        className="scroll-mt-4 outline-none"
        aria-busy={isPending}
      >
        <p role="status" aria-live="polite" className="mb-4 text-sm text-[var(--text-muted)]">
          {isPending
            ? t('items.loading')
            : result.ok && result.items.length > 0
              ? t('items.range', {
                  from: request.page * ITEM_PAGE_SIZE + 1,
                  to: request.page * ITEM_PAGE_SIZE + result.items.length,
                })
              : ''}
        </p>

        {isPending ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : !result.ok ? (
          <div
            role="alert"
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6"
          >
            <p className="font-medium text-[var(--text-primary)]">{t('items.loadError')}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{t('items.loadErrorHint')}</p>
            <Button
              variant="secondary"
              icon={<RefreshCw size={16} />}
              className="mt-4 min-h-12"
              onClick={() =>
                setRequest((current) => ({ ...current, revision: current.revision + 1, delay: 0 }))
              }
            >
              {t('items.retry')}
            </Button>
          </div>
        ) : result.items.length === 0 ? (
          <EmptyState
            icon="🎒"
            title={hasFilters ? t('items.empty.titleFiltered') : t('items.empty.title')}
            description={t('items.empty.description')}
            size="md"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((item) => (
              <SrdItemCard
                key={item.key}
                item={item}
                canEdit={characters.length > 0}
                lang={lang}
                onAddToCharacter={() => setSelectedItem(item)}
                onView={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}

        {!isPending && result.ok && (request.page > 0 || result.hasNext) && (
          <nav
            aria-label={t('items.pagination')}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              variant="secondary"
              className="min-h-12"
              icon={<ChevronLeft size={16} />}
              disabled={request.page === 0}
              onClick={() => changePage(request.page - 1)}
            >
              {t('items.previous')}
            </Button>
            <span className="text-sm text-[var(--text-muted)]">
              {t('items.page', { page: request.page + 1 })}
            </span>
            <Button
              variant="secondary"
              className="min-h-12"
              disabled={!result.hasNext}
              onClick={() => changePage(request.page + 1)}
            >
              {t('items.next')}
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </nav>
        )}
      </div>

      {selectedItem && (
        <SrdItemDetailDialog
          item={selectedItem}
          campaignId={campaignId}
          characters={characters}
          canEditCampaign={canEditCampaign}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  )
}
