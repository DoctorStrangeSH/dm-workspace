import type { CampaignStats } from '../../src/lib/types'

export function overviewStats(mode: string | null): CampaignStats {
  const empty = mode === 'empty'
  const attention = mode !== 'ready' && !empty
  return {
    chapters: {
      total: empty ? 0 : 12,
      visible: empty ? 0 : 9,
      hidden: empty ? 0 : 3,
      empty: attention ? 2 : 0,
    },
    entities: {
      total: empty ? 0 : 28,
      visible: empty ? 0 : 25,
      no_description: attention ? 3 : 0,
      npc: empty ? 0 : 6,
      monster: empty ? 0 : 4,
      location: empty ? 0 : 5,
      item: empty ? 0 : 4,
      faction: empty ? 0 : 2,
      quest: empty ? 0 : 4,
      note: empty ? 0 : 3,
    },
    entities_without_stats: attention ? 1 : 0,
    relations: empty ? 0 : 14,
    tags: empty ? 0 : 8,
    recent: empty
      ? []
      : [
          {
            type: 'chapter',
            id: 'chapter',
            name: 'An unusually long chapter title about the observatory and its mysterious hidden archive',
            updated_at: '2026-10-29T07:58:00Z',
          },
          {
            type: 'entity',
            id: 'npc',
            name: 'The keeper of forgotten stars',
            updated_at: '2026-10-28T08:00:00Z',
          },
        ],
  }
}
