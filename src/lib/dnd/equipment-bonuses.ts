import type { CharacterInventoryItem } from '@/lib/types'

export interface EquipmentBonuses {
  ac: number
  initiative: number
}

/** Pure derived bonuses. Invalid JSON never becomes an effective bonus. */
export function getEquipmentBonuses(items: readonly CharacterInventoryItem[] | undefined): EquipmentBonuses {
  const result = { ac: 0, initiative: 0 }
  for (const item of items ?? []) {
    if (!item?.equipped) continue
    if (typeof item.acBonus === 'number' && Number.isInteger(item.acBonus) && item.acBonus >= -5 && item.acBonus <= 5)
      result.ac += item.acBonus
    if (typeof item.initiativeBonus === 'number' && Number.isInteger(item.initiativeBonus) && item.initiativeBonus >= -5 && item.initiativeBonus <= 5)
      result.initiative += item.initiativeBonus
  }
  return result
}
