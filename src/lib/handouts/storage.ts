import type { Handout } from '@/lib/types'

// Existing records contain public URLs; newer records may store only the path.
// Only accept object paths inside the handouts bucket.
export function handoutStoragePath(value: string): string | null {
  if (typeof value !== 'string') return null
  let path = value
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      const marker = '/storage/v1/object/public/handouts/'
      const markerIndex = url.pathname.indexOf(marker)
      if (markerIndex < 0) return null
      path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
    } catch {
      return null
    }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-zA-Z_-]+\.(?:png|jpe?g|webp|gif|avif)$/.test(path)) return null
  return path
}

export function withAuthorizedHandoutUrl(handout: Handout): Handout {
  return { ...handout, image_url: `/api/handouts/${handout.id}/image` }
}
