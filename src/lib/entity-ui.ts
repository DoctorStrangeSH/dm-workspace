import type { EntityType } from '@/lib/types'

interface TypeStyle {
  icon: string
  labelKey: string
  color: string
  bg: string
  border: string
}

/**
 * CHANGES (К7.4.1):
 * - `label: string` → `labelKey: string` — для i18n (используй t(style.labelKey))
 * - Цвета переведены на семантические токены (--accent, --success, ...)
 *   вместо хардкода indigo/emerald/amber/red/violet/yellow/slate.
 *   Это позволяет темам (light/dark) работать корректно.
 */
export const ENTITY_STYLES: Record<EntityType, TypeStyle> = {
  npc: {
    icon: '👤',
    labelKey: 'entityType.npc',
    color: 'text-[var(--accent-text)]',
    bg: 'bg-[var(--accent-subtle)]',
    border: 'border-[var(--accent)]/40',
  },
  location: {
    icon: '🗺️',
    labelKey: 'entityType.location',
    color: 'text-[var(--success-text)]',
    bg: 'bg-[var(--success-subtle)]',
    border: 'border-[var(--success)]/40',
  },
  item: {
    icon: '⚔️',
    labelKey: 'entityType.item',
    color: 'text-[var(--warning-text)]',
    bg: 'bg-[var(--warning-subtle)]',
    border: 'border-[var(--warning)]/40',
  },
  monster: {
    icon: '👹',
    labelKey: 'entityType.monster',
    color: 'text-[var(--danger-text)]',
    bg: 'bg-[var(--danger-subtle)]',
    border: 'border-[var(--danger)]/40',
  },
  faction: {
    icon: '🏛️',
    labelKey: 'entityType.faction',
    color: 'text-[var(--info-text)]',
    bg: 'bg-[var(--info-subtle)]',
    border: 'border-[var(--info)]/40',
  },
  quest: {
    icon: '📜',
    labelKey: 'entityType.quest',
    color: 'text-[var(--warning-text)]',
    bg: 'bg-[var(--warning-subtle)]',
    border: 'border-[var(--warning)]/40',
  },
  note: {
    icon: '📝',
    labelKey: 'entityType.note',
    color: 'text-[var(--text-muted)]',
    bg: 'bg-[var(--bg-secondary)]',
    border: 'border-[var(--border-default)]',
  },
}

/**
 * CHANGES: `label` убран, теперь рендерим через t('entityType.' + value).
 * Для 'all' — t('common.all').
 */
export const ENTITY_FILTERS: { value: EntityType | 'all' }[] = [
  { value: 'all' },
  { value: 'npc' },
  { value: 'location' },
  { value: 'item' },
  { value: 'monster' },
  { value: 'faction' },
  { value: 'quest' },
]
