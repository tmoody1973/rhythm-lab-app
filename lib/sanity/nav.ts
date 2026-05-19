import { client } from './client'
import { SITE_SETTINGS_QUERY } from './queries/aboutPage'

export interface NavItem {
  label: string
  href: string
}

// Hardcoded fallback used when Sanity has no items or the fetch fails
const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Live', href: '/live' },
  { label: 'Blog', href: '/blog' },
  { label: 'Deep Dives', href: '/deep-dives' },
  { label: 'Episodes', href: '/episodes' },
  { label: 'Profiles', href: '/profiles' },
  { label: 'About', href: '/about' },
  { label: 'Weekly Show', href: '/archive' },
  { label: 'Search', href: '/search' },
]

interface SiteSettingsResult {
  siteTitle?: string
  navItems?: NavItem[]
}

/**
 * Fetch navigation items from Sanity siteSettings singleton.
 * Returns hardcoded defaults if Sanity has no items or the fetch fails.
 */
export async function getNavItems(): Promise<NavItem[]> {
  try {
    const data = await client.fetch<SiteSettingsResult | null>(SITE_SETTINGS_QUERY)
    const items = data?.navItems
    if (Array.isArray(items) && items.length > 0) {
      const valid = items.filter((item): item is NavItem =>
        typeof item?.label === 'string' && typeof item?.href === 'string'
      )
      if (valid.length > 0) return valid
    }
    return DEFAULT_NAV_ITEMS
  } catch (err) {
    console.error('Failed to fetch nav items from Sanity:', err)
    return DEFAULT_NAV_ITEMS
  }
}

export { DEFAULT_NAV_ITEMS }
