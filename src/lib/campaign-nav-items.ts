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
  labelKey: string
  icon: LucideIcon
  exact?: boolean
  dmOnly?: boolean
}

/** Match route segments, so /characters-new never activates /characters. */
export function isCampaignNavActive(
  pathname: string,
  item: Pick<CampaignNavItem, 'href' | 'exact'>
): boolean {
  return pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`))
}

export function getCampaignNavGroups(base: string, isDm: boolean) {
  const items = getCampaignNavItems(base).filter((item) => !item.dmOnly || isDm)
  const groups = [
    {
      key: 'nav.group.play',
      routes: [base, `${base}/sessions`, `${base}/characters`, `${base}/scenes`],
    },
    { key: 'nav.group.world', routes: [`${base}/chapters`, `${base}/entities`] },
    {
      key: 'nav.group.reference',
      routes: [`${base}/bestiary`, `${base}/spells`, `${base}/items`, `${base}/generators`],
    },
  ]
  return groups.map((group) => ({
    labelKey: group.key,
    items: group.routes.flatMap((href) => items.filter((item) => item.href === href)),
  }))
}

export function getCampaignNavItems(base: string): CampaignNavItem[] {
  return [
    { href: base, labelKey: 'nav.overview', icon: Home, exact: true },
    { href: `${base}/sessions`, labelKey: 'nav.sessions', icon: Calendar },
    { href: `${base}/chapters`, labelKey: 'nav.chapters', icon: BookOpen },
    { href: `${base}/characters`, labelKey: 'nav.characters', icon: Sword },
    { href: `${base}/scenes`, labelKey: 'nav.scenes', icon: Map },
    { href: `${base}/entities`, labelKey: 'nav.entities', icon: Users },
    { href: `${base}/bestiary`, labelKey: 'nav.bestiary', icon: Library },
    { href: `${base}/spells`, labelKey: 'nav.spells', icon: Sparkles },
    { href: `${base}/items`, labelKey: 'nav.items', icon: Package },
    // CHANGES (задача 1): генераторы — только DM
    { href: `${base}/generators`, labelKey: 'nav.generators', icon: Dices, dmOnly: true },
  ]
}

export function getMobileNavItems(base: string): CampaignNavItem[] {
  return [
    { href: base, labelKey: 'nav.overview', icon: Home, exact: true },
    { href: `${base}/chapters`, labelKey: 'nav.chapters', icon: BookOpen },
    { href: `${base}/characters`, labelKey: 'nav.characters', icon: Sword },
    { href: `${base}/scenes`, labelKey: 'nav.scenes', icon: Map },
  ]
}
