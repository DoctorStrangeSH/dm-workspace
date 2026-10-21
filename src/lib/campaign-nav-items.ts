import { Home, BookOpen, Sword, Map, Users, Library, Sparkles, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface CampaignNavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

/**
 * CHANGES: убраны несуществующие страницы `npcs`, `locations`, `monsters` —
 * это фильтры на `/entities`, а не отдельные маршруты (они давали 404 в prefetch).
 * Оставлены только реально существующие маршруты.
 */
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
  ]
}

/**
 * Пункты для мобильного bottom-nav (5 главных).
 * CHANGES: новый экспорт — для `mobile-bottom-nav.tsx`.
 */
export function getMobileNavItems(base: string): CampaignNavItem[] {
  return [
    { href: base, label: 'Обзор', icon: Home, exact: true },
    { href: `${base}/chapters`, label: 'Главы', icon: BookOpen },
    { href: `${base}/characters`, label: 'Персонажи', icon: Sword },
    { href: `${base}/scenes`, label: 'Сцены', icon: Map },
    { href: `${base}/entities`, label: 'Сущности', icon: Users },
  ]
}
