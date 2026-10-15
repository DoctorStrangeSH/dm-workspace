// ============================================================
// Базовые типы
// ============================================================

export type CampaignRole = 'dm' | 'player'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  genre: string | null
  description: string | null
  owner_id: string
  invite_code: string
  created_at: string
  updated_at: string
}

export interface CampaignMember {
  id: string
  campaign_id: string
  user_id: string
  role: CampaignRole
  joined_at: string
}

export interface CampaignWithRole extends Campaign {
  role: CampaignRole
  members_count?: number
}

// ============================================================
// Главы
// ============================================================

export interface Chapter {
  id: string
  campaign_id: string
  title: string
  content_md: string
  order_index: number
  is_visible_to_players: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Сущности (NPC, локации, предметы, монстры, ...)
// ============================================================

export type EntityType =
  | 'npc'
  | 'location'
  | 'item'
  | 'monster'
  | 'faction'
  | 'quest'
  | 'note'

export interface Entity {
  id: string
  campaign_id: string
  type: EntityType
  name: string
  description: string
  data_json: Record<string, unknown>
  image_url: string | null
  is_visible_to_players: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Справочники для UI
// ============================================================

export const GENRES = [
  'Фэнтези',
  'Хоррор',
  'Научная фантастика',
  'Киберпанк',
  'Стимпанк',
  'Постапокалипсис',
  'Детектив',
  'Мистика',
  'Пиратское',
  'Вестерн',
  'Современность',
  'Другое',
] as const

export type Genre = (typeof GENRES)[number]

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  npc: 'NPC',
  location: 'Локация',
  item: 'Предмет',
  monster: 'Монстр',
  faction: 'Фракция',
  quest: 'Квест',
  note: 'Заметка',
}

export const ENTITY_TYPE_ICONS: Record<EntityType, string> = {
  npc: '👤',
  location: '🗺️',
  item: '⚔️',
  monster: '👹',
  faction: '🏛️',
  quest: '📜',
  note: '📝',
}