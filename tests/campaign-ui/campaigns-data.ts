import type { CampaignWithRole } from '../../src/lib/types'

const base = {
  owner_id: 'self',
  genre: 'Fantasy',
  created_at: '2026-10-31T09:00:00Z',
  updated_at: '2026-10-31T09:00:00Z',
}
export const campaignFixtures: CampaignWithRole[] = [
  {
    ...base,
    id: 'offline-campaign',
    name: 'Journey to the Everlasting Celestial Constellation and the Unbreakable Ancient Citadel',
    description: 'A synthetic campaign preview.\n' + 'Unbroken'.repeat(20),
    invite_code: 'oldcode8',
    role: 'dm',
  },
  {
    ...base,
    id: 'offline-other-campaign',
    name: 'Unbroken'.repeat(12),
    genre: 'LegacyGenre'.repeat(8),
    description: null,
    invite_code: 'LegacyCode'.repeat(8),
    role: 'player',
  },
]
Object.assign(window, { __campaignFixtures: campaignFixtures })
