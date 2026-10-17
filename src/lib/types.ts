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

// ============================================================
// data_json — структурированные данные сущностей
// ============================================================

/**
 * Характеристики D&D 5.24 (STR, DEX, CON, INT, WIS, CHA).
 * Значения 1-30, модификатор = floor((score - 10) / 2).
 */
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
  type?: string // "fiend", "beast", "humanoid", ...
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
  rarity?:
    | 'common'
    | 'uncommon'
    | 'rare'
    | 'very_rare'
    | 'legendary'
    | 'artifact'
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
// Связи между сущностями
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
  /** Обратное название (для incoming) */
  reverseLabel: string
  icon: string
  color: string
}

export const RELATION_TYPES: Record<RelationType, RelationTypeInfo> = {
  member_of: {
    label: 'Член',
    reverseLabel: 'Члены',
    icon: '⚔️',
    color: 'text-indigo-300',
  },
  leader_of: {
    label: 'Лидер',
    reverseLabel: 'Лидер',
    icon: '👑',
    color: 'text-amber-300',
  },
  located_in: {
    label: 'Находится в',
    reverseLabel: 'Содержит',
    icon: '📍',
    color: 'text-emerald-300',
  },
  owns: {
    label: 'Владеет',
    reverseLabel: 'Принадлежит',
    icon: '🎁',
    color: 'text-yellow-300',
  },
  quest_giver: {
    label: 'Выдал квест',
    reverseLabel: 'Выдан',
    icon: '📜',
    color: 'text-violet-300',
  },
  quest_target: {
    label: 'Цель квеста',
    reverseLabel: 'Цель квеста для',
    icon: '🎯',
    color: 'text-red-300',
  },
  ally_of: {
    label: 'Союзник',
    reverseLabel: 'Союзник',
    icon: '🤝',
    color: 'text-green-300',
  },
  enemy_of: {
    label: 'Враг',
    reverseLabel: 'Враг',
    icon: '⚔️',
    color: 'text-red-300',
  },
  parent_of: {
    label: 'Родительская локация',
    reverseLabel: 'Дочерние локации',
    icon: '🗺️',
    color: 'text-emerald-300',
  },
  related_to: {
    label: 'Связано с',
    reverseLabel: 'Связано с',
    icon: '🔗',
    color: 'text-slate-300',
  },
}

/**
 * Допустимые типы связей для пар типов сущностей.
 * Ключ — "sourceType→targetType", значение — массив типов.
 */
export const ALLOWED_RELATIONS: Record<string, RelationType[]> = {
  'npc→faction': ['member_of', 'leader_of'],
  'npc→location': ['located_in'],
  'npc→item': ['owns'],
  'npc→quest': ['quest_giver'],
  'npc→npc': ['ally_of', 'enemy_of', 'related_to'],
  'npc→monster': ['ally_of', 'enemy_of'],
  'location→location': ['located_in', 'parent_of'],   // ← ОБНОВЛЕНО
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

/**
 * Возвращает допустимые типы связей для пары типов.
 */
export function getAllowedRelations(
  sourceType: EntityType,
  targetType: EntityType
): RelationType[] {
  const key = `${sourceType}→${targetType}`
  return ALLOWED_RELATIONS[key] ?? ['related_to']
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

/**
 * Палитра для тегов — выбираем случайно при создании.
 */
export const TAG_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#84cc16', // lime
] as const

/**
 * Нормализует имя тега: убирает #, пробелы по краям, ограничивает длину.
 */
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
// Статистика кампании
// ============================================================

export interface CampaignStats {
  chapters: {
    total: number
    visible: number
    hidden: number
    empty: number
  }
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
  recent: Array<{
    type: 'chapter' | 'entity'
    id: string
    name: string
    updated_at: string
  }>
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

export interface CharacterSpell {
  id?: string
  name: string
  level: number
  prepared?: boolean
  notes?: string
}

export interface CharacterInventoryItem {
  id?: string
  name: string
  quantity: number
  weight?: number
  equipped?: boolean
  attuned?: boolean
  notes?: string
}

export interface CharacterData {
  /** Уровень */
  level: number
  /** Класс (slug) */
  class: string
  /** Раса (slug) */
  race: string
  /** Предыстория (slug) */
  background?: string
  /** Мировоззрение */
  alignment?: string

  /** Характеристики (1-30) */
  abilities: Record<AbilityKey, number>

  /** Владение навыками */
  proficientSkills?: SkillKey[]
  /** Владение спасбросками */
  proficientSaves?: AbilityKey[]
  deathSaves?: DeathSaves

  /** HP */
  hp: CharacterHP
  /** AC */
  ac: number
  /** Скорость (футов) */
  speed: number

  /** Атаки */
  attacks?: CharacterAttack[]
  /** Заклинания */
  spells?: CharacterSpell[]
  spellSlots?: SpellSlots
  spellcastingAbility?: AbilityKey
  /** Ячейки заклинаний по уровням */
  spellSlots?: Record<number, { current: number; max: number }>
  /** Инвентарь */
  inventory?: CharacterInventoryItem[]
  currency?: Currency
  /** Деньги */
  currency?: { pp?: number; gp?: number; sp?: number; cp?: number }

  /** Особенности класса / расы */
  features?: string[]
  /** Черты */
  traits?: string[]

  /** Заметки */
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

export interface DeathSaves {
  successes: number  // 0-3
  failures: number   // 0-3
  stabilized: boolean
}

/**
 * Пустой персонаж — дефолтные значения.
 */
export function createEmptyCharacterData(): CharacterData {
  return {
    level: 1,
    class: '',
    race: '',
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    hp: { current: 10, max: 10, temp: 0 },
    ac: 10,
    speed: 30,
  }
}

/**
 * Названия характеристик на русском.
 */
export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
}

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: 'СИЛ',
  dex: 'ЛОВ',
  con: 'ТЕЛ',
  int: 'ИНТ',
  wis: 'МДР',
  cha: 'ХАР',
}

/**
 * Названия навыков на русском.
 */
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

/**
 * К какой характеристике относится навык.
 */
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
// Заклинания
// ============================================================

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
  level: number // 0-9
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

// ============================================================
// Инвентарь
// ============================================================

export interface CharacterInventoryItem {
  id: string
  name: string
  quantity: number
  weight?: number       // вес 1 единицы (фунты)
  equipped?: boolean
  attuned?: boolean
  notes?: string
  description?: string
}

export interface Currency {
  pp?: number  // платина
  gp?: number  // золото
  sp?: number  // серебро
  cp?: number  // медь
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

/** Максимум attuned предметов */
export const MAX_ATTUNEMENTS = 3

/** Грузоподъемность: STR × 15 lbs */
export function getCarryingCapacity(strengthScore: number): number {
  return strengthScore * 15
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