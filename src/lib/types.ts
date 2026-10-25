// ============================================================
// Базовые типы
// ============================================================

export type CampaignRole = 'dm' | 'player'
export type ThemeMode = 'dark' | 'light' | 'system'

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

export interface UserSettings {
  userId: string
  theme: ThemeMode
  updatedAt: string
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
// Сущности
// ============================================================

export type EntityType = 'npc' | 'location' | 'item' | 'monster' | 'faction' | 'quest' | 'note'

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
// UI справочники
// ============================================================

export const GENRES = [
  'fantasy',
  'horror',
  'sci-fi',
  'cyberpunk',
  'steampunk',
  'post-apocalyptic',
  'detective',
  'mystic',
  'pirate',
  'western',
  'modern',
  'other',
] as const

export type Genre = (typeof GENRES)[number]

/** Старые русские значения → slug (для миграции БД). */
export const GENRE_RU_TO_SLUG: Record<string, Genre> = {
  Фэнтези: 'fantasy',
  Хоррор: 'horror',
  'Научная фантастика': 'sci-fi',
  Киберпанк: 'cyberpunk',
  Стимпанк: 'steampunk',
  Постапокалипсис: 'post-apocalyptic',
  Детектив: 'detective',
  Мистика: 'mystic',
  Пиратское: 'pirate',
  Вестерн: 'western',
  Современность: 'modern',
  Другое: 'other',
}

// CHANGES (К9): Удалены ENTITY_TYPE_LABELS, ENTITY_TYPE_ICONS.
// В UI — t(`entityType.${type}`) и ENTITY_STYLES[type].icon (в entity-ui.ts).

// ============================================================
// data_json
// ============================================================

export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface MonsterData {
  ac?: number
  hp?: number
  hp_max?: number
  speed?: number
  abilities?: Partial<AbilityScores>
  cr?: string
  xp?: number
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
  alignment?: string
  type?: string
  saves?: Partial<AbilityScores>
  skills?: Record<string, number>
  resistances?: string
  immunities?: string
  senses?: string
  languages?: string
  traits?: string
  actions?: string
  legendary_actions?: string
}

export interface NpcData {
  role?: string
  attitude?: 'friendly' | 'neutral' | 'hostile'
  faction?: string
  location?: string
  race?: string
  occupation?: string
  motivation?: string
  notes?: string
}

export interface ItemData {
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
  attunement?: boolean
  item_type?: string
  cost?: string
  weight?: string
  properties?: string
  requirements?: string
  notes?: string
}

export interface LocationData {
  location_type?: string
  region?: string
  parent_location?: string
  population?: string
  government?: string
  notable_features?: string
  notes?: string
}

export interface FactionData {
  leader?: string
  base?: string
  alignment?: string
  influence?: string
  notes?: string
}

export interface QuestData {
  status?: 'active' | 'completed' | 'failed' | 'paused'
  giver?: string
  reward?: string
  location?: string
  notes?: string
}

export type EntityData =
  | MonsterData
  | NpcData
  | ItemData
  | LocationData
  | FactionData
  | QuestData
  | Record<string, unknown>

// ============================================================
// Связи
// ============================================================

export type RelationType =
  | 'member_of'
  | 'leader_of'
  | 'located_in'
  | 'owns'
  | 'quest_giver'
  | 'quest_target'
  | 'ally_of'
  | 'enemy_of'
  | 'parent_of'
  | 'related_to'

export interface EntityRelation {
  relationId: string
  direction: 'outgoing' | 'incoming'
  relationType: RelationType
  sourceId: string
  sourceName: string
  sourceType: EntityType
  targetId: string
  targetName: string
  targetType: EntityType
  metadata: Record<string, unknown>
}

/**
 * CHANGES (К9): Упрощено — оставлен только `icon`.
 * label/reverseLabel — через t(`relationType.${type}.label|reverse`).
 * color — не использовался.
 */
export interface RelationTypeInfo {
  icon: string
}

export const RELATION_TYPES: Record<RelationType, RelationTypeInfo> = {
  member_of: { icon: '⚔️' },
  leader_of: { icon: '👑' },
  located_in: { icon: '📍' },
  owns: { icon: '🎁' },
  quest_giver: { icon: '📜' },
  quest_target: { icon: '🎯' },
  ally_of: { icon: '🤝' },
  enemy_of: { icon: '⚔️' },
  parent_of: { icon: '🗺️' },
  related_to: { icon: '🔗' },
}

export const ALLOWED_RELATIONS: Record<string, RelationType[]> = {
  'npc→faction': ['member_of', 'leader_of'],
  'npc→location': ['located_in'],
  'npc→item': ['owns'],
  'npc→quest': ['quest_giver'],
  'npc→npc': ['ally_of', 'enemy_of', 'related_to'],
  'npc→monster': ['ally_of', 'enemy_of'],
  'location→location': ['located_in', 'parent_of'],
  'location→npc': ['related_to'],
  'location→faction': ['related_to'],
  'location→item': ['related_to'],
  'location→quest': ['quest_target'],
  'location→monster': ['related_to'],
  'item→npc': ['owns'],
  'item→location': ['located_in'],
  'faction→npc': ['member_of', 'leader_of'],
  'faction→faction': ['ally_of', 'enemy_of'],
  'faction→location': ['located_in'],
  'quest→npc': ['quest_target'],
  'quest→location': ['quest_target'],
  'monster→npc': ['ally_of', 'enemy_of'],
  'monster→location': ['located_in'],
  'monster→monster': ['ally_of', 'enemy_of'],
}

export function getAllowedRelations(
  sourceType: EntityType,
  targetType: EntityType
): RelationType[] {
  return ALLOWED_RELATIONS[`${sourceType}→${targetType}`] ?? ['related_to']
}

// ============================================================
// Теги
// ============================================================

export interface Tag {
  id: string
  name: string
  color: string
  entitiesCount?: number
}

export interface EntityTag {
  id: string
  name: string
  color: string
}

export const TAG_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#84cc16',
] as const

export function normalizeTagName(input: string): string {
  return input.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase().slice(0, 40)
}

export interface EntityTemplate {
  id: string
  campaignId: string | null
  type: EntityType
  name: string
  description: string
  dataJson: Record<string, unknown>
  icon: string | null
  isBuiltin: boolean
  createdAt: string
}

// ============================================================
// Статистика
// ============================================================

export interface CampaignStats {
  chapters: { total: number; visible: number; hidden: number; empty: number }
  entities: {
    total: number
    visible: number
    no_description: number
    npc: number
    location: number
    item: number
    monster: number
    faction: number
    quest: number
    note: number
  }
  entities_without_stats: number
  relations: number
  tags: number
  recent: Array<{ type: 'chapter' | 'entity'; id: string; name: string; updated_at: string }>
}

// ============================================================
// Персонажи
// ============================================================

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type SkillKey =
  | 'acrobatics'
  | 'animal-handling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight-of-hand'
  | 'stealth'
  | 'survival'

export interface CharacterHP {
  current: number
  max: number
  temp: number
}

export interface CharacterAttack {
  name: string
  bonus: number
  damage: string
  damageType?: string
  notes?: string
}

export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation'

// CHANGES (К9): Удалён SPELL_SCHOOLS — в UI t(`school.${school}`).

export interface CharacterSpell {
  id: string
  name: string
  level: number
  school?: SpellSchool
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  description?: string
  prepared?: boolean
  alwaysPrepared?: boolean
  ritual?: boolean
}

export interface SpellSlotLevel {
  current: number
  max: number
}

export type SpellSlots = Record<number, SpellSlotLevel>

export interface CharacterInventoryItem {
  id: string
  name: string
  quantity: number
  weight?: number
  equipped?: boolean
  attuned?: boolean
  notes?: string
  description?: string
}

export interface Currency {
  pp?: number
  gp?: number
  sp?: number
  cp?: number
}

// CHANGES (К9): Удалены CURRENCY_LABELS, CURRENCY_SHORT.
// В UI — t(`currency.${key}`) и t(`currencyShort.${key}`).

export const MAX_ATTUNEMENTS = 3

export function getCarryingCapacity(strengthScore: number): number {
  return strengthScore * 15
}

export interface DeathSaves {
  successes: number
  failures: number
  stabilized: boolean
}

export interface CharacterData {
  level: number
  class: string
  race: string
  background?: string
  alignment?: string
  abilities: Record<AbilityKey, number>
  proficientSkills?: SkillKey[]
  proficientSaves?: AbilityKey[]
  deathSaves?: DeathSaves
  hp: CharacterHP
  ac: number
  speed: number
  attacks?: CharacterAttack[]
  spells?: CharacterSpell[]
  spellSlots?: SpellSlots
  spellcastingAbility?: AbilityKey
  inventory?: CharacterInventoryItem[]
  currency?: Currency
  features?: string[]
  traits?: string[]
  notes?: string
}

export interface Character {
  id: string
  campaign_id: string
  user_id: string
  name: string
  data_json: CharacterData
  is_active: boolean
  is_visible_to_party: boolean
  created_at: string
  updated_at: string
}

export interface CharacterWithOwner extends Character {
  owner: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function createEmptyCharacterData(): CharacterData {
  return {
    level: 1,
    class: '',
    race: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hp: { current: 10, max: 10, temp: 0 },
    ac: 10,
    speed: 30,
  }
}

// CHANGES (К9): Удалены ABILITY_LABELS, ABILITY_SHORT, SKILL_LABELS.
// В UI — t(`ability.${key}`), t(`abilityShort.${key}`), t(`skill.${key}`).

export const SKILL_ABILITY: Record<SkillKey, AbilityKey> = {
  acrobatics: 'dex',
  'animal-handling': 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  'sleight-of-hand': 'dex',
  stealth: 'dex',
  survival: 'wis',
}

// ============================================================
// Чат
// ============================================================

export type MessageType = 'text' | 'roll' | 'system' | 'whisper'

export interface DiceRollMetadata {
  expression: string
  rolls: number[]
  total: number
  modifier: number
  advantage?: boolean
  disadvantage?: boolean
  label?: string
}

export interface MessageMetadata {
  roll?: DiceRollMetadata
  characterId?: string
  characterName?: string
  isDmRoll?: boolean
  targetUserId?: string
  targetUserName?: string
}

export interface Message {
  id: string
  campaign_id: string
  user_id: string
  content: string
  type: MessageType
  metadata: MessageMetadata
  created_at: string
}

export interface MessageWithAuthor extends Message {
  author: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

// ============================================================
// Сцены
// ============================================================

export type GridType = 'square' | 'hex' | 'none'

export interface Scene {
  id: string
  campaign_id: string
  name: string
  image_url: string | null
  grid_type: GridType
  grid_size: number
  width: number
  height: number
  is_active: boolean
  fog_enabled: boolean
  created_at: string
  updated_at: string
}

// CHANGES (5.1): Стены на карте
export interface SceneWall {
  id: string
  scene_id: string
  campaign_id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  created_by: string
  created_at: string
}

// CHANGES (5.2): Запросы на призыв существ
export type SummonStatus = 'pending' | 'approved' | 'rejected'

export interface SummonRequest {
  id: string
  campaign_id: string
  scene_id: string
  requester_id: string
  monster_name: string
  monster_entity_id: string | null
  monster_count: number
  status: SummonStatus
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface SummonRequestWithRequester extends SummonRequest {
  requester: {
    id: string
    username: string
    display_name: string | null
  }
}

export interface TokenCondition {
  name: string
  icon?: string
}

export interface Token {
  id: string
  scene_id: string
  entity_id: string | null
  character_id: string | null
  owner_id: string | null
  name: string
  image_url: string | null
  x: number
  y: number
  size: number
  hp_current: number | null
  hp_max: number | null
  conditions: TokenCondition[]
  ac?: number | null
  color: string
  is_hidden: boolean
  created_at: string
  updated_at: string
}

/**
 * CHANGES (К9): Убран `label` — в UI t(`condition.${name}`).
 * Оставлены name + icon (используются в token-menu.tsx).
 */
export const CONDITION_LIST = [
  { name: 'blinded', icon: '👁️' },
  { name: 'charmed', icon: '💗' },
  { name: 'deafened', icon: '🔇' },
  { name: 'frightened', icon: '😨' },
  { name: 'grappled', icon: '✊' },
  { name: 'incapacitated', icon: '💤' },
  { name: 'invisible', icon: '👻' },
  { name: 'paralyzed', icon: '🧊' },
  { name: 'petrified', icon: '🗿' },
  { name: 'poisoned', icon: '🤢' },
  { name: 'prone', icon: '🛌' },
  { name: 'restrained', icon: '🪢' },
  { name: 'stunned', icon: '💫' },
  { name: 'unconscious', icon: '💀' },
] as const

export interface InitiativeEntry {
  id: string
  scene_id: string
  token_id: string
  initiative: number
  turn_order: number
  is_current: boolean
  created_at: string
}

export interface InitiativeEntryWithToken extends InitiativeEntry {
  token: Token
}

export interface FogArea {
  id: string
  scene_id: string
  campaign_id: string
  x: number
  y: number
  width: number
  height: number
  is_revealed: boolean
  created_at: string
}

export interface Playlist {
  id: string
  campaign_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  playlist_id: string
  campaign_id: string
  name: string
  audio_url: string
  duration: number | null
  order_index: number
  created_at: string
}

export interface MusicPlayerState {
  campaign_id: string
  current_track_id: string | null
  is_playing: boolean
  position_seconds: number
  volume: number
  updated_at: string
}

export interface Handout {
  id: string
  campaign_id: string
  name: string
  image_url: string
  is_visible: boolean
  created_at: string
}

export interface SessionLog {
  id: string
  campaign_id: string
  actor_id: string | null
  event_type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * CHANGES (К9): Оставлен как fallback для неизвестных event_type.
 * Для известных — t(`logEvent.${type}`).
 */
export const LOG_EVENT_LABELS: Record<string, string> = {
  combat_start: '⚔️ Бой начат',
  combat_end: '🏳️ Бой завершён',
  token_move: '📍 Перемещение',
  token_damage: '💥 Урон',
  token_add: '➕ Токен добавлен',
  token_delete: '🗑️ Токен удалён',
  handout_show: '🖼️ Хендаут показан',
  music_play: '🎵 Музыка',
  level_up: '⬆️ Level-up',
  chapter_create: '📖 Глава создана',
}

export interface BackgroundInfo {
  slug: string
  name: string
  skills: SkillKey[]
}

// ============================================================
// Сессии (календарь)
// ============================================================

export type RsvpStatus = 'yes' | 'no' | 'maybe'

export interface Session {
  id: string
  campaign_id: string
  title: string
  description: string | null
  starts_at: string
  duration_minutes: number
  created_by: string
  created_at: string
}

export interface SessionRsvp {
  id: string
  session_id: string
  user_id: string
  status: RsvpStatus
  updated_at: string
}

export interface SessionWithRsvp extends Session {
  rsvps: SessionRsvp[]
  creator: {
    id: string
    username: string
    display_name: string | null
  }
}

/**
 * CHANGES (К9): Убран `label` — в UI t(`rsvp.${status}`).
 * Оставлен `icon` (используется в sessions-client.tsx).
 */
export const RSVP_LABELS: Record<RsvpStatus, { icon: string }> = {
  yes: { icon: '✅' },
  no: { icon: '❌' },
  maybe: { icon: '🤔' },
}

// ============================================================
// SRD — язык
// ============================================================

export type SrdLang = 'ru' | 'en'

export function srdName(item: { name: string; name_ru: string | null }, lang: SrdLang): string {
  if (lang === 'en') return item.name
  return item.name_ru ?? item.name
}

// CHANGES (5.3): Совместные токены
export interface TokenOwner {
  token_id: string
  user_id: string
  campaign_id: string
  added_by: string
  created_at: string
}

export interface TokenOwnerWithProfile extends TokenOwner {
  profile: {
    id: string
    username: string
    display_name: string | null
  }
}
