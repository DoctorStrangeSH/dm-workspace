import { toEntityLibraryCard } from '../../src/lib/quest-journal'

export const questJournalFixtures = [
  {
    id: 'active',
    status: 'active',
    name: 'Пропавший караван Caravan',
    giver: 'Альма Alma',
    location: 'Старая башня Tower',
    reward: '50 золотых Gold',
  },
  { id: 'completed', status: 'completed', name: 'Спасённый мост Bridge' },
  { id: 'paused', status: 'paused', name: 'Забытый ключ Key' },
  { id: 'failed', status: 'failed', name: 'Упущенный след Trail' },
  { id: 'missing', name: 'Без отметки Unmarked' },
  { id: 'custom', status: { bad: true }, name: 'Старое задание Legacy' },
  { id: 'hidden', status: 'active', name: 'Скрытый договор Secret pact', reward: 'SECRET REWARD' },
].map((quest, index) =>
  toEntityLibraryCard({
    id: quest.id,
    type: 'quest',
    name: quest.name,
    description: 'Описание цели Goal description',
    is_visible_to_players: quest.id !== 'hidden',
    updated_at: `2026-11-14T00:00:0${index}Z`,
    quest_status: quest.status,
    quest_giver: quest.giver,
    quest_reward: quest.reward,
    quest_location: quest.location,
  })
)
