import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getCampaignNavGroups,
  getCampaignNavItems,
  getMobileNavItems,
  isCampaignNavActive,
} from '../src/lib/campaign-nav-items'

const base = '/campaign/test'
test('active navigation matches complete route segments and exact overview', () => {
  const [overview, , , characters] = getCampaignNavItems(base)
  assert.equal(isCampaignNavActive(base, overview), true)
  assert.equal(isCampaignNavActive(`${base}/characters`, overview), false)
  assert.equal(isCampaignNavActive(`${base}/characters/hero`, characters), true)
  assert.equal(isCampaignNavActive(`${base}/characters-new`, characters), false)
  assert.equal(isCampaignNavActive('/campaign/another/characters', characters), false)
})
test('grouped menu includes each permitted route exactly once', () => {
  for (const isDm of [true, false]) {
    const actual = getCampaignNavGroups(base, isDm).flatMap((group) =>
      group.items.map((item) => item.href)
    )
    const expected = getCampaignNavItems(base)
      .filter((item) => isDm || !item.dmOnly)
      .map((item) => item.href)
    assert.deepEqual([...actual].sort(), expected.sort())
    assert.equal(new Set(actual).size, actual.length)
  }
})
test('four quick links are available to both roles and leave room for More', () => {
  const playerRoutes = getCampaignNavGroups(base, false).flatMap((group) =>
    group.items.map((item) => item.href)
  )
  const quick = getMobileNavItems(base)
  assert.equal(quick.length, 4)
  assert.equal(
    quick.every((item) => playerRoutes.includes(item.href)),
    true
  )
})
