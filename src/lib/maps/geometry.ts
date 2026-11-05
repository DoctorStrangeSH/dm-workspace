export interface MapPoint {
  x: number
  y: number
}
/** Bounds are the rendered (transformed) layer, never the scroll viewport. */
export function clientToGrid(
  point: { clientX: number; clientY: number },
  bounds: { left: number; top: number; width: number; height: number },
  columns: number,
  rows: number,
  snap: 'cell' | 'vertex' | 'half' = 'vertex'
): MapPoint {
  const x = ((point.clientX - bounds.left) / bounds.width) * columns
  const y = ((point.clientY - bounds.top) / bounds.height) * rows
  const round = (n: number) =>
    snap === 'cell' ? Math.floor(n) : snap === 'half' ? Math.round(n * 2) / 2 : Math.round(n)
  const edge = snap === 'cell' ? 1 : 0
  return {
    x: Math.max(0, Math.min(columns - edge, round(x))),
    y: Math.max(0, Math.min(rows - edge, round(y))),
  }
}
export const clampZoom = (zoom: number) => Math.min(3, Math.max(0.05, zoom))
export function fitMap(width: number, height: number, viewWidth: number, viewHeight: number) {
  return clampZoom(
    Math.min(1, Math.max(1, viewWidth - 32) / width, Math.max(1, viewHeight - 32) / height)
  )
}
/** Opaque cache revision: never put storage paths or signed URL credentials in the image request. */
export function mapRevision(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}
export function mapFileError(file: {
  type: string
  size: number
}): 'type' | 'size' | 'empty' | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'type'
  if (file.size <= 0) return 'empty'
  if (file.size > 10 * 1024 * 1024) return 'size'
  return null
}
