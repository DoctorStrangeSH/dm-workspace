import type { MapPoint } from './geometry'

export type RouteMetric = 'straight' | 'grid'
export const MAX_ROUTE_POINTS = 50

/** Visual planning only: no terrain, wall, speed or movement-rule adjudication. */
export function routeDistance(points: readonly MapPoint[], metric: RouteMetric) {
  let cells = 0
  for (let i = 1; i < points.length; i++) {
    const dx = Math.abs(points[i].x - points[i - 1].x)
    const dy = Math.abs(points[i].y - points[i - 1].y)
    cells += metric === 'grid' ? Math.max(dx, dy) : Math.hypot(dx, dy)
  }
  return { cells: Math.round(cells * 10) / 10, feet: Math.round(cells * 5) }
}

export function appendRoutePoint(points: readonly MapPoint[], point: MapPoint): MapPoint[] {
  const last = points.at(-1)
  if (points.length >= MAX_ROUTE_POINTS || (last?.x === point.x && last.y === point.y))
    return [...points]
  return [...points, point]
}
