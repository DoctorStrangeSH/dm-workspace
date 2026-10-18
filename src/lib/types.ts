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
// UI справочники
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

export interface RelationTypeInfo {
  label: string
  reverseLabel: string
  icon: string
  color: string
}

export const RELATION_TYPES: Record<RelationType, RelationTypeInfo> = {
  member_of: { label: 'Член', reverseLabel: 'Члены', icon: '⚔️', color: 'text-indigo-300' },
  leader_of: { label: 'Лидер', reverseLabel: 'Лидер', icon: '👑', color: 'text-amber-300' },
  located_in: { label: 'Находится в', reverseLabel: 'Содержит', icon: '📍', color: 'text-emerald-300' },
  owns: { label: 'Владеет', reverseLabel: 'Принадлежит', icon: '🎁', color: 'text-yellow-300' },
  quest_giver: { label: 'Выдал квест', reverseLabel: 'Выдан', icon: '📜', color: 'text-violet-300' },
  quest_target: { label: 'Цель квеста', reverseLabel: 'Цель квеста для', icon: '🎯', color: 'text-red-300' },
  ally_of: { label: 'Союзник', reverseLabel: 'Союзник', icon: '🤝', color: 'text-green-300' },
  enemy_of: { label: 'Враг', reverseLabel: 'Враг', icon: '⚔️', color: 'text-red-300' },
  parent_of: { label: 'Родительская локация', reverseLabel: 'Дочерние локации', icon: '🗺️', color: 'text-emerald-300' },
  related_to: { label: 'Связано с', reverseLabel: 'Связано с', icon: '🔗', color: 'text-slate-300' },
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
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#a855f7', '#84cc16',
] as const

export function normalizeTagName(input: string): string {
  return input
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 40)
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
    total: number; visible: number; no_description: number
    npc: number; location: number; item: number; monster: number
    faction: number; quest: number; note: number
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

export const SPELL_SCHOOLS: Record<SpellSchool, string> = {
  abjuration: 'Ограждение',
  conjuration: 'Вызов',
  divination: 'Прорицание',
  enchantment: 'Очарование',
  evocation: 'Воплощение',
  illusion: 'Иллюзия',
  necromancy: 'Некромантия',
  transmutation: 'Преобразование',
}

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

export const CURRENCY_LABELS: Record<keyof Currency, string> = {
  pp: 'Платина (pp)',
  gp: 'Золото (gp)',
  sp: 'Серебро (sp)',
  cp: 'Медь (cp)',
}

export const CURRENCY_SHORT: Record<keyof Currency, string> = {
  pp: 'pp',
  gp: 'gp',
  sp: 'sp',
  cp: 'cp',
}

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

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Сила', dex: 'Ловкость', con: 'Телосложение',
  int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма',
}

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: 'СИЛ', dex: 'ЛОВ', con: 'ТЕЛ',
  int: 'ИНТ', wis: 'МДР', cha: 'ХАР',
}

export const SKILL_LABELS: Record<SkillKey, string> = {
  acrobatics: 'Акробатика',
  'animal-handling': 'Обращение с животными',
  arcana: 'Магия',
  athletics: 'Атлетика',
  deception: 'Обман',
  history: 'История',
  insight: 'Проницательность',
  intimidation: 'Запугивание',
  investigation: 'Расследование',
  medicine: 'Медицина',
  nature: 'Природа',
  perception: 'Внимательность',
  performance: 'Выступление',
  persuasion: 'Убеждение',
  religion: 'Религия',
  'sleight-of-hand': 'Ловкость рук',
  stealth: 'Скрытность',
  survival: 'Выживание',
}

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
  color: string
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export const CONDITION_LIST = [
  { name: 'blinded', label: 'Ослеплён', icon: '👁️' },
  { name: 'charmed', label: 'Очарован', icon: '💗' },
  { name: 'deafened', label: 'Оглох', icon: '🔇' },
  { name: 'frightened', label: 'Испуган', icon: '😨' },
  { name: 'grappled', label: 'Схвачен', icon: '✊' },
  { name: 'incapacitated', label: 'Недееспособен', icon: '💤' },
  { name: 'invisible', label: 'Невидим', icon: '👻' },
  { name: 'paralyzed', label: 'Парализован', icon: '🧊' },
  { name: 'petrified', label: 'Окаменел', icon: '🗿' },
  { name: 'poisoned', label: 'Отравлен', icon: '🤢' },
  { name: 'prone', label: 'Лежит', icon: '🛌' },
  { name: 'restrained', label: 'Опутан', icon: '🪢' },
  { name: 'stunned', label: 'Оглушён', icon: '💫' },
  { name: 'unconscious', label: 'Без сознания', icon: '💀' },
]

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