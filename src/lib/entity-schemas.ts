import type { EntityType } from '@/lib/types'

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean'

export interface FieldOption {
  value: string
  labelKey: string
}

export interface FieldSchema {
  key: string
  labelKey: string
  type: FieldType
  placeholderKey?: string
  options?: FieldOption[]
  min?: number
  max?: number
  sectionKey?: string
  hintKey?: string
}

/**
 * CHANGES (К9):
 * - Убраны дублирующие русские `label`/`placeholder`/`section`/`options[].label`/`hint`.
 * - Оставлены только `*Key` — в UI используется `t(field.labelKey)` и т.д.
 * - `entity-data-form.tsx` уже работает через `*Key` (К7.4.3).
 */
export const ENTITY_SCHEMAS: Record<EntityType, FieldSchema[]> = {
  monster: [
    {
      key: 'size',
      labelKey: 'entityField.monster.size',
      type: 'select',
      sectionKey: 'entitySection.monster.basic',
      options: [
        { value: 'tiny', labelKey: 'monsterSize.tiny' },
        { value: 'small', labelKey: 'monsterSize.small' },
        { value: 'medium', labelKey: 'monsterSize.medium' },
        { value: 'large', labelKey: 'monsterSize.large' },
        { value: 'huge', labelKey: 'monsterSize.huge' },
        { value: 'gargantuan', labelKey: 'monsterSize.gargantuan' },
      ],
    },
    {
      key: 'type',
      labelKey: 'entityField.monster.type',
      type: 'text',
      placeholderKey: 'entityField.monster.typePlaceholder',
      sectionKey: 'entitySection.monster.basic',
    },
    {
      key: 'alignment',
      labelKey: 'entityField.monster.alignment',
      type: 'text',
      placeholderKey: 'entityField.monster.alignmentPlaceholder',
      sectionKey: 'entitySection.monster.basic',
    },
    {
      key: 'cr',
      labelKey: 'entityField.monster.cr',
      type: 'text',
      placeholderKey: 'entityField.monster.crPlaceholder',
      sectionKey: 'entitySection.monster.basic',
    },
    {
      key: 'xp',
      labelKey: 'entityField.monster.xp',
      type: 'number',
      min: 0,
      sectionKey: 'entitySection.monster.basic',
    },
    {
      key: 'ac',
      labelKey: 'entityField.monster.ac',
      type: 'number',
      min: 0,
      max: 30,
      sectionKey: 'entitySection.monster.combat',
    },
    {
      key: 'hp_max',
      labelKey: 'entityField.monster.hpMax',
      type: 'number',
      min: 1,
      sectionKey: 'entitySection.monster.combat',
    },
    {
      key: 'speed',
      labelKey: 'entityField.monster.speed',
      type: 'number',
      min: 0,
      placeholderKey: 'entityField.monster.speedPlaceholder',
      sectionKey: 'entitySection.monster.combat',
    },
    {
      key: 'abilities.str',
      labelKey: 'entityField.monster.str',
      type: 'number',
      min: 1,
      max: 30,
      sectionKey: 'entitySection.monster.abilities',
    },
    {
      key: 'abilities.dex',
      labelKey: 'entityField.monster.dex',
      type: 'number',
      min: 1,
      max: 30,
      sectionKey: 'entitySection.monster.abilities',
    },
    {
      key: 'abilities.con',
      labelKey: 'entityField.monster.con',
      type: 'number',
      min: 1,
      max: 30,
      sectionKey: 'entitySection.monster.abilities',
    },
    {
      key: 'abilities.int',
      labelKey: 'entityField.monster.int',
      type: 'number',
      min: 1,
      max: 30,
      sectionKey: 'entitySection.monster.abilities',
    },
    {
      key: 'abilities.wis',
      labelKey: 'entityField.monster.wis',
      type: 'number',
      min: 1,
      max: 30,
      sectionKey: 'entitySection.monster.abilities',
    },
    {
      key: 'abilities.cha',
      labelKey: 'entityField.monster.cha',
      type: 'number',
      min: 1,
      max: 30,
      sectionKey: 'entitySection.monster.abilities',
    },
    {
      key: 'resistances',
      labelKey: 'entityField.monster.resistances',
      type: 'text',
      placeholderKey: 'entityField.monster.resistancesPlaceholder',
      sectionKey: 'entitySection.monster.defenses',
    },
    {
      key: 'immunities',
      labelKey: 'entityField.monster.immunities',
      type: 'text',
      placeholderKey: 'entityField.monster.immunitiesPlaceholder',
      sectionKey: 'entitySection.monster.defenses',
    },
    {
      key: 'senses',
      labelKey: 'entityField.monster.senses',
      type: 'text',
      placeholderKey: 'entityField.monster.sensesPlaceholder',
      sectionKey: 'entitySection.monster.defenses',
    },
    {
      key: 'languages',
      labelKey: 'entityField.monster.languages',
      type: 'text',
      placeholderKey: 'entityField.monster.languagesPlaceholder',
      sectionKey: 'entitySection.monster.defenses',
    },
    {
      key: 'traits',
      labelKey: 'entityField.monster.traits',
      type: 'textarea',
      placeholderKey: 'entityField.monster.traitsPlaceholder',
      sectionKey: 'entitySection.monster.abilitiesSection',
    },
    {
      key: 'actions',
      labelKey: 'entityField.monster.actions',
      type: 'textarea',
      placeholderKey: 'entityField.monster.actionsPlaceholder',
      sectionKey: 'entitySection.monster.abilitiesSection',
    },
    {
      key: 'legendary_actions',
      labelKey: 'entityField.monster.legendaryActions',
      type: 'textarea',
      placeholderKey: 'entityField.monster.legendaryActionsPlaceholder',
      sectionKey: 'entitySection.monster.abilitiesSection',
    },
  ],

  npc: [
    {
      key: 'role',
      labelKey: 'entityField.npc.role',
      type: 'text',
      placeholderKey: 'entityField.npc.rolePlaceholder',
    },
    {
      key: 'race',
      labelKey: 'entityField.npc.race',
      type: 'text',
      placeholderKey: 'entityField.npc.racePlaceholder',
    },
    {
      key: 'occupation',
      labelKey: 'entityField.npc.occupation',
      type: 'text',
      placeholderKey: 'entityField.npc.occupationPlaceholder',
    },
    {
      key: 'attitude',
      labelKey: 'entityField.npc.attitude',
      type: 'select',
      options: [
        { value: 'friendly', labelKey: 'npcAttitude.friendly' },
        { value: 'neutral', labelKey: 'npcAttitude.neutral' },
        { value: 'hostile', labelKey: 'npcAttitude.hostile' },
      ],
    },
    {
      key: 'faction',
      labelKey: 'entityField.npc.faction',
      type: 'text',
      placeholderKey: 'entityField.npc.factionPlaceholder',
    },
    {
      key: 'location',
      labelKey: 'entityField.npc.location',
      type: 'text',
      placeholderKey: 'entityField.npc.locationPlaceholder',
    },
    {
      key: 'motivation',
      labelKey: 'entityField.npc.motivation',
      type: 'textarea',
      placeholderKey: 'entityField.npc.motivationPlaceholder',
    },
    {
      key: 'notes',
      labelKey: 'entityField.npc.notes',
      type: 'textarea',
      placeholderKey: 'entityField.npc.notesPlaceholder',
    },
  ],

  item: [
    {
      key: 'rarity',
      labelKey: 'entityField.item.rarity',
      type: 'select',
      options: [
        { value: 'common', labelKey: 'itemRarity.common' },
        { value: 'uncommon', labelKey: 'itemRarity.uncommon' },
        { value: 'rare', labelKey: 'itemRarity.rare' },
        { value: 'very_rare', labelKey: 'itemRarity.veryRare' },
        { value: 'legendary', labelKey: 'itemRarity.legendary' },
        { value: 'artifact', labelKey: 'itemRarity.artifact' },
      ],
    },
    {
      key: 'item_type',
      labelKey: 'entityField.item.itemType',
      type: 'text',
      placeholderKey: 'entityField.item.itemTypePlaceholder',
    },
    {
      key: 'attunement',
      labelKey: 'entityField.item.attunement',
      type: 'boolean',
    },
    {
      key: 'cost',
      labelKey: 'entityField.item.cost',
      type: 'text',
      placeholderKey: 'entityField.item.costPlaceholder',
    },
    {
      key: 'weight',
      labelKey: 'entityField.item.weight',
      type: 'text',
      placeholderKey: 'entityField.item.weightPlaceholder',
    },
    {
      key: 'properties',
      labelKey: 'entityField.item.properties',
      type: 'textarea',
      placeholderKey: 'entityField.item.propertiesPlaceholder',
    },
    {
      key: 'requirements',
      labelKey: 'entityField.item.requirements',
      type: 'text',
      placeholderKey: 'entityField.item.requirementsPlaceholder',
    },
    {
      key: 'notes',
      labelKey: 'entityField.item.notes',
      type: 'textarea',
      placeholderKey: 'entityField.item.notesPlaceholder',
    },
  ],

  location: [
    {
      key: 'location_type',
      labelKey: 'entityField.location.locationType',
      type: 'text',
      placeholderKey: 'entityField.location.locationTypePlaceholder',
    },
    {
      key: 'region',
      labelKey: 'entityField.location.region',
      type: 'text',
      placeholderKey: 'entityField.location.regionPlaceholder',
    },
    {
      key: 'population',
      labelKey: 'entityField.location.population',
      type: 'text',
      placeholderKey: 'entityField.location.populationPlaceholder',
    },
    {
      key: 'government',
      labelKey: 'entityField.location.government',
      type: 'text',
      placeholderKey: 'entityField.location.governmentPlaceholder',
    },
    {
      key: 'notable_features',
      labelKey: 'entityField.location.notableFeatures',
      type: 'textarea',
      placeholderKey: 'entityField.location.notableFeaturesPlaceholder',
    },
    {
      key: 'notes',
      labelKey: 'entityField.location.notes',
      type: 'textarea',
      placeholderKey: 'entityField.location.notesPlaceholder',
    },
  ],

  faction: [
    {
      key: 'leader',
      labelKey: 'entityField.faction.leader',
      type: 'text',
      placeholderKey: 'entityField.faction.leaderPlaceholder',
    },
    {
      key: 'base',
      labelKey: 'entityField.faction.base',
      type: 'text',
      placeholderKey: 'entityField.faction.basePlaceholder',
    },
    {
      key: 'alignment',
      labelKey: 'entityField.faction.alignment',
      type: 'text',
      placeholderKey: 'entityField.faction.alignmentPlaceholder',
    },
    {
      key: 'influence',
      labelKey: 'entityField.faction.influence',
      type: 'text',
      placeholderKey: 'entityField.faction.influencePlaceholder',
    },
    {
      key: 'notes',
      labelKey: 'entityField.faction.notes',
      type: 'textarea',
      placeholderKey: 'entityField.faction.notesPlaceholder',
    },
  ],

  quest: [
    {
      key: 'status',
      labelKey: 'entityField.quest.status',
      type: 'select',
      options: [
        { value: 'active', labelKey: 'questStatus.active' },
        { value: 'completed', labelKey: 'questStatus.completed' },
        { value: 'failed', labelKey: 'questStatus.failed' },
        { value: 'paused', labelKey: 'questStatus.paused' },
      ],
    },
    {
      key: 'giver',
      labelKey: 'entityField.quest.giver',
      type: 'text',
      placeholderKey: 'entityField.quest.giverPlaceholder',
    },
    {
      key: 'reward',
      labelKey: 'entityField.quest.reward',
      type: 'text',
      placeholderKey: 'entityField.quest.rewardPlaceholder',
    },
    {
      key: 'location',
      labelKey: 'entityField.quest.location',
      type: 'text',
      placeholderKey: 'entityField.quest.locationPlaceholder',
    },
    {
      key: 'notes',
      labelKey: 'entityField.quest.notes',
      type: 'textarea',
      placeholderKey: 'entityField.quest.notesPlaceholder',
    },
  ],

  note: [],
}

export function hasSchema(type: EntityType): boolean {
  return ENTITY_SCHEMAS[type]?.length > 0
}

export function groupFieldsBySection(fields: FieldSchema[]): Record<string, FieldSchema[]> {
  const sections: Record<string, FieldSchema[]> = {}
  for (const f of fields) {
    const section = f.sectionKey ?? 'entitySection.default'
    if (!sections[section]) sections[section] = []
    sections[section].push(f)
  }
  return sections
}
