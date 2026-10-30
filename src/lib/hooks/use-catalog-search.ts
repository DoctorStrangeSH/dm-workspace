'use client'

import { useEffect, useState } from 'react'
import { CATALOG_PAGE_SIZE, type CatalogPage } from '@/lib/srd/catalog-page'

export function useCatalogSearch<F, T>(
  initialFilters: F,
  initialPage: CatalogPage<T>,
  load: (filters: F, offset: number) => Promise<CatalogPage<T>>
) {
  const [request, setRequest] = useState({
    filters: initialFilters,
    page: 0,
    revision: 0,
    delay: 0,
  })
  const [response, setResponse] = useState({ revision: 0, result: initialPage })
  useEffect(() => {
    if (request.revision === 0) return
    let active = true
    const timer = setTimeout(async () => {
      let result: CatalogPage<T>
      try {
        result = await load(request.filters, request.page * CATALOG_PAGE_SIZE)
      } catch {
        result = { ok: false }
      }
      if (active) setResponse({ revision: request.revision, result })
    }, request.delay)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [request, load])
  return {
    filters: request.filters,
    page: request.page,
    pending: request.revision !== response.revision,
    result: response.result,
    updateFilters: (patch: Partial<F>, delay = 0) =>
      setRequest((current) => ({
        ...current,
        filters: { ...current.filters, ...patch },
        page: 0,
        revision: current.revision + 1,
        delay,
      })),
    changePage: (page: number) =>
      setRequest((current) => ({ ...current, page, revision: current.revision + 1, delay: 0 })),
    retry: () =>
      setRequest((current) => ({ ...current, revision: current.revision + 1, delay: 0 })),
  }
}
