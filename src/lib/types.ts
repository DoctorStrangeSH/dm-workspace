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