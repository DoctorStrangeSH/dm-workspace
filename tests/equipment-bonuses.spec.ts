import { expect, test } from '@playwright/test'
import { getEquipmentBonuses } from '../src/lib/dnd/equipment-bonuses'
import type { CharacterInventoryItem } from '../src/lib/types'

const item = (overrides: Partial<CharacterInventoryItem>): CharacterInventoryItem => ({
  id: 'test', name: 'Test item', quantity: 1, ...overrides,
})

test.describe('Equipped item bonuses', () => {
  test('adds only equipped bonuses and ignores unequipped items', () => {
    expect(getEquipmentBonuses([
      item({ equipped: true, acBonus: 2, initiativeBonus: 1 }),
      item({ equipped: false, acBonus: 5, initiativeBonus: 5 }),
      item({ equipped: true, acBonus: 1, initiativeBonus: -1 }),
    ])).toEqual({ ac: 3, initiative: 0 })
  })

  test('defaults to zero for existing items without new metadata', () => {
    expect(getEquipmentBonuses([item({ equipped: true })])).toEqual({ ac: 0, initiative: 0 })
    expect(getEquipmentBonuses(undefined)).toEqual({ ac: 0, initiative: 0 })
  })

  test('ignores malformed or out-of-range persisted bonuses', () => {
    expect(getEquipmentBonuses([
      item({ equipped: true, acBonus: Number.NaN, initiativeBonus: 100 }),
      item({ equipped: true, acBonus: '5' as unknown as number, initiativeBonus: 1.5 }),
    ])).toEqual({ ac: 0, initiative: 0 })
  })
})
