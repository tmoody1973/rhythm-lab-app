import { getNavItems } from "@/lib/sanity/nav"
import { HeaderClient } from "@/components/header-client"

export async function Header() {
  const navItems = await getNavItems()
  return <HeaderClient navItems={navItems} />
}
