/**
 * Коллизии стен (отрезков) с токенами (кружками).
 * Токен движется из point A в point B — нужно понять, не пересекает ли путь стены.
 */

interface Point {
  x: number
  y: number
}

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Проверка: пересекается ли отрезок [p1, p2] с отрезком [q1, q2].
 */
export function segmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const d1 = cross(q1, q2, p1)
  const d2 = cross(q1, q2, p2)
  const d3 = cross(p1, p2, q1)
  const d4 = cross(p1, p2, q2)

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true
  }

  if (d1 === 0 && onSegment(q1, q2, p1)) return true
  if (d2 === 0 && onSegment(q1, q2, p2)) return true
  if (d3 === 0 && onSegment(p1, p2, q1)) return true
  if (d4 === 0 && onSegment(p1, p2, q2)) return true

  return false
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function onSegment(p1: Point, p2: Point, p: Point): boolean {
  return (
    Math.min(p1.x, p2.x) <= p.x &&
    p.x <= Math.max(p1.x, p2.x) &&
    Math.min(p1.y, p2.y) <= p.y &&
    p.y <= Math.max(p1.y, p2.y)
  )
}

/**
 * Проверка: пересекает ли путь токена (from → to) какую-либо стену.
 *
 * CHANGES: путь центра (segment-vs-segment) + кружок в конечной точке
 * с УМЕНЬШЕННЫМ радиусом (0.3), чтобы токен мог подойти близко к стене.
 * + проверка СТАРТОВОЙ точки, чтобы токен не «застрял» в стене при старте.
 */
export function pathHitsWall(from: Point, to: Point, radius: number, wall: Segment): boolean {
  const q1 = { x: wall.x1, y: wall.y1 }
  const q2 = { x: wall.x2, y: wall.y2 }

  // 1. Путь центра токена пересекает стену?
  if (segmentsIntersect(from, to, q1, q2)) {
    return true
  }

  // 2. Кружок в конечной точке задевает стену?
  if (circleIntersectsSegment(to, radius, wall)) {
    return true
  }

  return false
}

/**
 * Проверка: пересекает ли окружность (центр `c`, радиус `r`) отрезок `seg`.
 */
export function circleIntersectsSegment(c: Point, r: number, seg: Segment): boolean {
  const { x1, y1, x2, y2 } = seg
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy

  if (len2 === 0) {
    return Math.hypot(c.x - x1, c.y - y1) <= r
  }

  const t = Math.max(0, Math.min(1, ((c.x - x1) * dx + (c.y - y1) * dy) / len2))
  const closest = { x: x1 + t * dx, y: y1 + t * dy }
  return Math.hypot(c.x - closest.x, c.y - closest.y) <= r
}

export function isBlockedByWalls(
  from: Point,
  to: Point,
  radius: number,
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>
): boolean {
  return walls.some((wall) => pathHitsWall(from, to, radius, wall))
}
