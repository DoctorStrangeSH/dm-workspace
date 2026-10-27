import type { Handout } from '@/lib/types'

// Broadcast payloads contain only deliberately public fields.
export type VisibleHandout = Pick<Handout, 'id' | 'campaign_id' | 'name' | 'is_visible'>

export function parseVisibleHandout(value: unknown, campaignId: string): VisibleHandout | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(record.id) ||
    record.campaign_id !== campaignId ||
    typeof record.name !== 'string' ||
    record.is_visible !== true
  ) return null

  return {
    id: record.id,
    campaign_id: campaignId,
    name: record.name,
    is_visible: true,
  }
}

export function parseDeletedHandoutId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const id = (value as Record<string, unknown>).id
  return typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) ? id : null
}
