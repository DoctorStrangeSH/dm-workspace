import type { EntityType } from '@/lib/types'

interface TypeStyle {
  icon: string
  label: string
  color: string
  bg: string
  border: string
}

export const ENTITY_STYLES: Record<EntityType, TypeStyle> = {
  npc: {
    icon: '👤',
    label: 'NPC',
    color: 'text-indigo-300',
    bg: 'bg-indigo-950/60',
    border: 'border-indigo-900/50',
  },
  location: {
    icon: '🗺️',
    label: 'Локация',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-900/50',
  },
  item: {
    icon: '⚔️',
    label: 'Предмет',
    color: 'text-amber-300',
    bg: 'bg-amber-950/60',
    border: 'border-amber-900/50',
  },
  monster: {
    icon: '👹',
    label: 'Монстр',
    color: 'text-red-300',
    bg: 'bg-red-950/60',
    border: 'border-red-900/50',
  },
  faction: {
    icon: '🏛️',
    label: 'Фракция',
    color: 'text-violet-300',
    bg: 'bg-violet-950/60',
    border: 'border-violet-900/50',
  },
  quest: {
    icon: '📜',
    label: 'Квест',
    color: 'text-yellow-300',
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-900/50',
  },
  note: {
    icon: '📝',
    label: 'Заметка',
    color: 'text-slate-300',
    bg: 'bg-slate-800/60',
    border: 'border-slate-700/50',
  },
}

export const ENTITY_FILTERS: { value: EntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'npc', label: '👤 NPC' },
  { value: 'location', label: '🗺️ Локации' },
  { value: 'item', label: '⚔️ Предметы' },
  { value: 'monster', label: '👹 Монстры' },
  { value: 'faction', label: '🏛️ Фракции' },
  { value: 'quest', label: '📜 Квесты' },
]
