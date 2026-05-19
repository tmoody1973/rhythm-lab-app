import { getNavItems } from '@/lib/sanity/nav'
import { MobileNavigation } from '@/components/mobile-navigation'

export default async function MobileNavigationWrapper() {
  const navItems = await getNavItems()
  return <MobileNavigation navItems={navItems} />
}
