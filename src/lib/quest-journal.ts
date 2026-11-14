import type { Entity } from './types'
import { readQuestObjectives } from './quest-objectives'

export const QUEST_STATUSES = ['active', 'completed', 'paused', 'failed', 'unset'] as const
export type QuestStatus = (typeof QUEST_STATUSES)[number]
export interface QuestSummary {
  status: QuestStatus
  giver?: string
  reward?: string
  location?: string
  progress?: { done: number; total: number }
}
type CardFields = Pick<
  Entity,
  'id' | 'type' | 'name' | 'description' | 'is_visible_to_players' | 'updated_at'
>
export type EntityLibraryCard = CardFields & { quest?: QuestSummary }
export type QuestLibraryRow = CardFields & {
  quest_status?: unknown
  quest_giver?: unknown
  quest_reward?: unknown
  quest_location?: unknown
  quest_objectives?: unknown
}

export function questStatus(value: unknown): QuestStatus {
  return typeof value === 'string' && QUEST_STATUSES.includes(value as QuestStatus)
    ? (value as QuestStatus)
    : 'unset'
}

const summaryText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 500) : undefined

/** Only the public card projection crosses the server/client boundary. */
export function toEntityLibraryCard(row: QuestLibraryRow): EntityLibraryCard {
  const objectives = row.type === 'quest' ? readQuestObjectives(row.quest_objectives) : null
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description,
    is_visible_to_players: row.is_visible_to_players,
    updated_at: row.updated_at,
    ...(row.type === 'quest'
      ? {
          quest: {
            status: questStatus(row.quest_status),
            giver: summaryText(row.quest_giver),
            reward: summaryText(row.quest_reward),
            location: summaryText(row.quest_location),
            ...(objectives?.length
              ? {
                  progress: {
                    done: objectives.filter((item) => item.done).length,
                    total: objectives.length,
                  },
                }
              : {}),
          },
        }
      : {}),
  }
}
