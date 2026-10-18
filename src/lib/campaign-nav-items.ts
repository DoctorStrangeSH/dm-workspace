import {
  Home,
  BookOpen,
  Map,
  Users,
  MapPin,
  Package,
  Skull,
  Sword,
  Library,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface CampaignNavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export function getCampaignNavItems(base: string): CampaignNavItem[] {
  return [
    { href: base, label: 'Обзор', icon: Home, exact: true },
    { href: `${base}/chapters`, label: 'Главы', icon: BookOpen },
    { href: `${base}/characters`, label: 'Персонажи', icon: Sword },
    { href: `${base}/scenes`, label: 'Сцены', icon: Map },
    { href: `${base}/entities`, label: 'Сущности', icon: Users },
    { href: `${base}/bestiary`, label: 'Бестиарий', icon: Library },
    { href: `${base}/spells`, label: 'Заклинания', icon: Sparkles },
    { href: `${base}/items`, label: 'Предметы', icon: Package },
    { href: `${base}/npcs`, label: 'NPC', icon: Users },
    { href: `${base}/locations`, label: 'Локации', icon: MapPin },
    { href: `${base}/monsters`, label: 'Монстры', icon: Skull },
  ]
}