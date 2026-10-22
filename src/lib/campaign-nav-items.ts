import {
  Home,
  BookOpen,
  Sword,
  Map,
  Users,
  Library,
  Sparkles,
  Package,
  Dices,
  Calendar,
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
    { href: `${base}/sessions`, label: 'Сессии', icon: Calendar },
    { href: `${base}/chapters`, label: 'Главы', icon: BookOpen },
    { href: `${base}/characters`, label: 'Персонажи', icon: Sword },
    { href: `${base}/scenes`, label: 'Сцены', icon: Map },
    { href: `${base}/entities`, label: 'Сущности', icon: Users },
    { href: `${base}/bestiary`, label: 'Бестиарий', icon: Library },
    { href: `${base}/spells`, label: 'Заклинания', icon: Sparkles },
    { href: `${base}/items`, label: 'Предметы', icon: Package },
    { href: `${base}/generators`, label: 'Генераторы', icon: Dices },
  ]
}

export function getMobileNavItems(base: string): CampaignNavItem[] {
  return [
    { href: base, label: 'Обзор', icon: Home, exact: true },
    { href: `${base}/chapters`, label: 'Главы', icon: BookOpen },
    { href: `${base}/characters`, label: 'Персонажи', icon: Sword },
    { href: `${base}/scenes`, label: 'Сцены', icon: Map },
    { href: `${base}/entities`, label: 'Сущности', icon: Users },
  ]
}
