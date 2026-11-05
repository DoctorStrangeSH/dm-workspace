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
