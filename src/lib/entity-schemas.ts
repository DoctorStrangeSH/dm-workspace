import type { EntityType } from '@/lib/types'

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldSchema {
  /** Ключ в data_json */
  key: string
  /** Название в UI */
  label: string
  /** Тип поля */
  type: FieldType
  /** Placeholder */
  placeholder?: string
  /** Опции для select */
  options?: FieldOption[]
  /** Минимум для number */
  min?: number
  /** Максимум для number */
  max?: number
  /** Секция (группировка) */
  section?: string
  /** Помощь (tooltip) */
  hint?: string
}

/**
 * Схемы полей для каждого типа сущности.
 * Порядок полей = порядок в UI.
 */
export const ENTITY_SCHEMAS: Record<EntityType, FieldSchema[]> = {
  monster: [
    // Основное
    {
      key: 'size',
      label: 'Размер',
      type: 'select',
      section: 'Основное',
      options: [
        { value: 'tiny', label: 'Крошечный (Tiny)' },
        { value: 'small', label: 'Маленький (Small)' },
        { value: 'medium', label: 'Средний (Medium)' },
        { value: 'large', label: 'Большой (Large)' },
        { value: 'huge', label: 'Огромный (Huge)' },
        { value: 'gargantuan', label: 'Громадный (Gargantuan)' },
      ],
    },
    {
      key: 'type',
      label: 'Тип',
      type: 'text',
      placeholder: 'fiend, beast, humanoid, undead...',
      section: 'Основное',
    },
    {
      key: 'alignment',
      label: 'Мировоззрение',
      type: 'text',
      placeholder: 'Chaotic Evil, Neutral, ...',
      section: 'Основное',
    },
    {
      key: 'cr',
      label: 'CR (Challenge Rating)',
      type: 'text',
      placeholder: '1/2, 1, 5, ...',
      section: 'Основное',
    },
    {
      key: 'xp',
      label: 'XP',
      type: 'number',
      min: 0,
      section: 'Основное',
    },

    // Боевые
    {
      key: 'ac',
      label: 'AC (Класс брони)',
      type: 'number',
      min: 0,
      max: 30,
      section: 'Боевые',
    },
    {
      key: 'hp_max',
      label: 'HP (Максимум)',
      type: 'number',
      min: 1,
      section: 'Боевые',
    },
    {
      key: 'speed',
      label: 'Скорость (футов)',
      type: 'number',
      min: 0,
      placeholder: '30',
      section: 'Боевые',
    },

    // Характеристики
    {
      key: 'abilities.str',
      label: 'Сила (STR)',
      type: 'number',
      min: 1,
      max: 30,
      section: 'Характеристики',
    },
    {
      key: 'abilities.dex',
      label: 'Ловкость (DEX)',
      type: 'number',
      min: 1,
      max: 30,
      section: 'Характеристики',
    },
    {
      key: 'abilities.con',
      label: 'Телосложение (CON)',
      type: 'number',
      min: 1,
      max: 30,
      section: 'Характеристики',
    },
    {
      key: 'abilities.int',
      label: 'Интеллект (INT)',
      type: 'number',
      min: 1,
      max: 30,
      section: 'Характеристики',
    },
    {
      key: 'abilities.wis',
      label: 'Мудрость (WIS)',
      type: 'number',
      min: 1,
      max: 30,
      section: 'Характеристики',
    },
    {
      key: 'abilities.cha',
      label: 'Харизма (CHA)',
      type: 'number',
      min: 1,
      max: 30,
      section: 'Характеристики',
    },

    // Защиты
    {
      key: 'resistances',
      label: 'Сопротивления',
      type: 'text',
      placeholder: 'fire, cold, ...',
      section: 'Защиты',
    },
    {
      key: 'immunities',
      label: 'Иммунитеты',
      type: 'text',
      placeholder: 'poison, ...',
      section: 'Защиты',
    },
    {
      key: 'senses',
      label: 'Чувства',
      type: 'text',
      placeholder: 'darkvision 60 ft., passive Perception 10',
      section: 'Защиты',
    },
    {
      key: 'languages',
      label: 'Языки',
      type: 'text',
      placeholder: 'Common, Abyssal',
      section: 'Защиты',
    },

    // Способности
    {
      key: 'traits',
      label: 'Особенности',
      type: 'textarea',
      placeholder: 'Особые способности, пассивные эффекты...',
      section: 'Способности',
    },
    {
      key: 'actions',
      label: 'Действия',
      type: 'textarea',
      placeholder: 'Атаки, заклинания, способности...',
      section: 'Способности',
    },
    {
      key: 'legendary_actions',
      label: 'Легендарные действия',
      type: 'textarea',
      placeholder: 'Легендарные действия...',
      section: 'Способности',
    },
  ],

  npc: [
    {
      key: 'role',
      label: 'Роль',
      type: 'text',
      placeholder: 'Трактирщик, Король, Купец...',
    },
    {
      key: 'race',
      label: 'Раса',
      type: 'text',
      placeholder: 'Человек, Эльф, Гном...',
    },
    {
      key: 'occupation',
      label: 'Занятие',
      type: 'text',
      placeholder: 'Кузнец, Бард, Стражник...',
    },
    {
      key: 'attitude',
      label: 'Отношение к партии',
      type: 'select',
      options: [
        { value: 'friendly', label: '😊 Дружелюбное' },
        { value: 'neutral', label: '😐 Нейтральное' },
        { value: 'hostile', label: '😠 Враждебное' },
      ],
    },
    {
      key: 'faction',
      label: 'Фракция',
      type: 'text',
      placeholder: 'Гильдия воров, Орден...',
    },
    {
      key: 'location',
      label: 'Локация',
      type: 'text',
      placeholder: 'Где обычно находится',
    },
    {
      key: 'motivation',
      label: 'Мотивация',
      type: 'textarea',
      placeholder: 'Цели, желания, страхи...',
    },
    {
      key: 'notes',
      label: 'Заметки',
      type: 'textarea',
      placeholder: 'Секреты, связи, слухи...',
    },
  ],

  item: [
    {
      key: 'rarity',
      label: 'Редкость',
      type: 'select',
      options: [
        { value: 'common', label: 'Обычный (Common)' },
        { value: 'uncommon', label: 'Необычный (Uncommon)' },
        { value: 'rare', label: 'Редкий (Rare)' },
        { value: 'very_rare', label: 'Очень редкий (Very Rare)' },
        { value: 'legendary', label: 'Легендарный (Legendary)' },
        { value: 'artifact', label: 'Артефакт (Artifact)' },
      ],
    },
    {
      key: 'item_type',
      label: 'Тип предмета',
      type: 'text',
      placeholder: 'Оружие, Броня, Зелье, Кольцо...',
    },
    {
      key: 'attunement',
      label: 'Требует настройки',
      type: 'boolean',
    },
    {
      key: 'cost',
      label: 'Стоимость',
      type: 'text',
      placeholder: '100 gp, 50 sp, ...',
    },
    {
      key: 'weight',
      label: 'Вес',
      type: 'text',
      placeholder: '2 lb., 5 kg, ...',
    },
    {
      key: 'properties',
      label: 'Свойства',
      type: 'textarea',
      placeholder: 'Магические свойства, эффекты...',
    },
    {
      key: 'requirements',
      label: 'Требования',
      type: 'text',
      placeholder: 'Требуется настройка существом...',
    },
    {
      key: 'notes',
      label: 'Заметки',
      type: 'textarea',
      placeholder: 'История, слухи...',
    },
  ],

  location: [
    {
      key: 'location_type',
      label: 'Тип',
      type: 'text',
      placeholder: 'Город, Деревня, Подземелье, Лес...',
    },
    {
      key: 'region',
      label: 'Регион',
      type: 'text',
      placeholder: 'Королевство, область...',
    },
    {
      key: 'population',
      label: 'Население',
      type: 'text',
      placeholder: '1000, 50000, ...',
    },
    {
      key: 'government',
      label: 'Правление',
      type: 'text',
      placeholder: 'Монархия, республика, ...',
    },
    {
      key: 'notable_features',
      label: 'Известные особенности',
      type: 'textarea',
      placeholder: 'Достопримечательности, опасности...',
    },
    {
      key: 'notes',
      label: 'Заметки',
      type: 'textarea',
      placeholder: 'Секреты, слухи, ...',
    },
  ],

  faction: [
    {
      key: 'leader',
      label: 'Лидер',
      type: 'text',
      placeholder: 'Имя лидера',
    },
    {
      key: 'base',
      label: 'Штаб-квартира',
      type: 'text',
      placeholder: 'Где базируется',
    },
    {
      key: 'alignment',
      label: 'Мировоззрение',
      type: 'text',
      placeholder: 'Lawful Good, Neutral, ...',
    },
    {
      key: 'influence',
      label: 'Влияние',
      type: 'text',
      placeholder: 'Локальное, региональное, ...',
    },
    {
      key: 'notes',
      label: 'Заметки',
      type: 'textarea',
      placeholder: 'История, цели, ...',
    },
  ],

  quest: [
    {
      key: 'status',
      label: 'Статус',
      type: 'select',
      options: [
        { value: 'active', label: '🟢 Активный' },
        { value: 'completed', label: '✅ Завершён' },
        { value: 'failed', label: '❌ Провален' },
        { value: 'paused', label: '⏸️ Приостановлен' },
      ],
    },
    {
      key: 'giver',
      label: 'Кто выдал',
      type: 'text',
      placeholder: 'NPC, фракция...',
    },
    {
      key: 'reward',
      label: 'Награда',
      type: 'text',
      placeholder: 'Золото, предмет, услуга...',
    },
    {
      key: 'location',
      label: 'Локация',
      type: 'text',
      placeholder: 'Где происходит',
    },
    {
      key: 'notes',
      label: 'Заметки',
      type: 'textarea',
      placeholder: 'Условия, детали...',
    },
  ],

  note: [],
}

/**
 * Проверяет, есть ли схема для типа.
 */
export function hasSchema(type: EntityType): boolean {
  return ENTITY_SCHEMAS[type]?.length > 0
}

/**
 * Группирует поля по секциям.
 */
export function groupFieldsBySection(
  fields: FieldSchema[]
): Record<string, FieldSchema[]> {
  const sections: Record<string, FieldSchema[]> = {}
  for (const f of fields) {
    const section = f.section ?? 'Без секции'
    if (!sections[section]) sections[section] = []
    sections[section].push(f)
  }
  return sections
}