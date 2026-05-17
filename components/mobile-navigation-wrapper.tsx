'use client'

import Link from 'next/link'
import { Home, Radio, Music, Search, BookOpen } from 'lucide-react'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Weekly Show', href: '/shows', icon: Radio },
  { label: 'Profiles', href: '/profiles', icon: Music },
  { label: 'Deep Dives', href: '/deep-dives', icon: BookOpen },
  { label: 'Episodes', href: '/episodes', icon: BookOpen },
  { label: 'Search', href: '/search', icon: Search },
]

export default function MobileNavigationWrapper() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex md:hidden">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 py-2 text-xs gap-1 transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
