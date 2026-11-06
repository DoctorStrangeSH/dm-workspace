import type { Scene, Token, InitiativeEntryWithToken } from '../../src/lib/types'
export const mapScene: Scene = {
  id: 'offline-scene',
  campaign_id: 'test',
  name: 'Руины обсерватории — битва под звёздами',
  image_url: null,
  grid_type: 'square',
  grid_size: 50,
  width: 24,
  height: 16,
  is_active: true,
  fog_enabled: false,
  created_at: '2026-11-05',
  updated_at: '2026-11-05',
}
export const mapTokens: Token[] = [
  { id: 'hero', name: 'Серебряная хранительница дальних звёзд', x: 3, y: 4, color: '#a78bfa' },
  { id: 'guard', name: 'Страж обсерватории', x: 17, y: 10, color: '#eab308' },
].map((row) => ({
  ...row,
  scene_id: mapScene.id,
  entity_id: null,
  character_id: null,
  owner_id: row.id === 'hero' ? 'self' : 'other',
  image_url: null,
  size: 1,
  hp_current: 12,
  hp_max: 20,
  ac: 15,
  conditions: [],
  is_hidden: false,
  created_at: '2026-11-05',
  updated_at: '2026-11-05',
}))
export const mapInitiative: InitiativeEntryWithToken[] = mapTokens.map((token, index) => ({
  id: 'entry-' + index,
  scene_id: mapScene.id,
  token_id: token.id,
  initiative: index === 0 ? 0 : 18,
  turn_order: index,
  is_current: false,
  created_at: '2026-11-05',
  token,
}))

export const battleTokens: Token[] = Array.from({ length: 11 }, (_, index) => ({
  ...mapTokens[0],
  id: 'battle-' + index,
  name: [
    'Аэлина — хранительница звёзд',
    'Торин Железный Щит',
    'Мира, следопыт',
    'Гоблин-разведчик',
    'Гоблин-разведчик',
    'Орк-ветеран',
    'Волк',
    'Гоблин-лучник',
    'Гоблин-лучник',
    'Шаман сумерек',
    'Огр — страж руин',
  ][index],
  character_id: index < 3 ? 'character-' + index : null,
  entity_id: index >= 3 ? 'entity-' + index : null,
  x: 2 + (index % 6) * 3,
  y: 2 + Math.floor(index / 6) * 6,
  color: index < 3 ? '#818cf8' : '#fb923c',
  image_url:
    index === 0
      ? 'data:image/svg+xml,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#312e81"/><circle cx="32" cy="24" r="12" fill="#c7d2fe"/><path d="M8 64a24 24 0 0 1 48 0" fill="#a5b4fc"/></svg>'
        )
      : null,
}))
export const battleInitiative: InitiativeEntryWithToken[] = battleTokens.map((token, index) => ({
  ...mapInitiative[0],
  id: 'battle-entry-' + index,
  token_id: token.id,
  token,
  initiative: index === 10 ? 0 : 22 - index * 2,
  turn_order: index * 3,
  is_current: false,
}))
