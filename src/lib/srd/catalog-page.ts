export const CATALOG_PAGE_SIZE = 24
export type CatalogPage<T> = { ok: true; items: T[]; hasNext: boolean } | { ok: false }

export function validCatalogOffset(offset: unknown): offset is number {
  return (
    typeof offset === 'number' && Number.isSafeInteger(offset) && offset >= 0 && offset <= 100000
  )
}
