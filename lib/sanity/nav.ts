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
  mobileNavItems?: NavItem[]
}

function validNavItems(items: unknown): NavItem[] | null {
  if (!Array.isArray(items) || items.length === 0) return null
  const valid = items.filter((item): item is NavItem =>
    typeof item?.label === 'string' && typeof item?.href === 'string'
  )
  return valid.length > 0 ? valid : null
}

/**
 * Fetch desktop nav items from Sanity siteSettings.
 * Returns hardcoded defaults if Sanity has no items or the fetch fails.
 */
export async function getNavItems(): Promise<NavItem[]> {
  try {
    const data = await client.fetch<SiteSettingsResult | null>(SITE_SETTINGS_QUERY)
    return validNavItems(data?.navItems) ?? DEFAULT_NAV_ITEMS
  } catch (err) {
    console.error('Failed to fetch nav items from Sanity:', err)
    return DEFAULT_NAV_ITEMS
  }
}

/**
 * Fetch curated mobile nav items (max 5) from Sanity siteSettings.
 * Falls back to first 5 of desktop navItems if mobileNavItems is empty.
 */
export async function getMobileNavItems(): Promise<NavItem[]> {
  try {
    const data = await client.fetch<SiteSettingsResult | null>(SITE_SETTINGS_QUERY)
    const mobile = validNavItems(data?.mobileNavItems)
    if (mobile) return mobile.slice(0, 5)
    const desktop = validNavItems(data?.navItems) ?? DEFAULT_NAV_ITEMS
    return desktop.slice(0, 5)
  } catch (err) {
    console.error('Failed to fetch mobile nav items from Sanity:', err)
    return DEFAULT_NAV_ITEMS.slice(0, 5)
  }
}

export { DEFAULT_NAV_ITEMS }
