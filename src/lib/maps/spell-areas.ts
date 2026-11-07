import type { MapPoint } from './geometry'

export type AreaShape = 'sphere' | 'cone' | 'line' | 'cube'
export interface AreaPlacement {
  origin: MapPoint
  angle: number
}
export const AREA_PRESETS = [
  { key: 'fireball', shape: 'sphere', size: 20, width: 5 },
  { key: 'burningHands', shape: 'cone', size: 15, width: 5 },
  { key: 'lightningBolt', shape: 'line', size: 100, width: 5 },
  { key: 'thunderwave', shape: 'cube', size: 15, width: 5 },
] as const

export function areaSize(value: number) {
  return Number.isFinite(value) ? Math.max(5, Math.min(300, value)) : 5
}

/** Visual geometry in grid cells (5 feet each); no targeting, damage or rule resolution. */
export function spellArea(
  shape: AreaShape,
  sizeFeet: number,
  widthFeet: number,
  placement: AreaPlacement
) {
  const length = areaSize(sizeFeet) / 5
  const halfWidth = (shape === 'line' ? areaSize(widthFeet) / 5 : length) / 2
  const { origin, angle } = placement
  const project = (forward: number, across: number): MapPoint => ({
    x: origin.x + forward * Math.cos(angle) - across * Math.sin(angle),
    y: origin.y + forward * Math.sin(angle) + across * Math.cos(angle),
  })
  const points =
    shape === 'cone'
      ? [origin, project(length, -halfWidth), project(length, halfWidth)]
      : shape === 'cube'
        ? [
            project(-halfWidth, -halfWidth),
            project(halfWidth, -halfWidth),
            project(halfWidth, halfWidth),
            project(-halfWidth, halfWidth),
          ]
        : [
            project(0, -halfWidth),
            project(length, -halfWidth),
            project(length, halfWidth),
            project(0, halfWidth),
          ]
  return {
    points,
    radius: length,
    tip: project(shape === 'cube' ? length / 2 : length, 0),
    label: shape === 'sphere' || shape === 'cube' ? origin : project(length / 2, 0),
  }
}
