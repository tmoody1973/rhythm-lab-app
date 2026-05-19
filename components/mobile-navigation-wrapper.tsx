import { getMobileNavItems } from '@/lib/sanity/nav'
import { MobileNavigation } from '@/components/mobile-navigation'

export default async function MobileNavigationWrapper() {
  const navItems = await getMobileNavItems()
  return <MobileNavigation navItems={navItems} />
}
