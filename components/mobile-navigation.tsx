'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Radio, Music, Search, BookOpen, Info, Users, Headphones } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { NavItem } from '@/lib/sanity/nav'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

// Map nav labels to lucide icons. Falls back to Home for unknown labels.
const ICON_MAP: Record<string, IconComponent> = {
  home: Home,
  live: Radio,
  blog: BookOpen,
  'deep dives': BookOpen,
  episodes: Headphones,
  profiles: Music,
  about: Info,
  'weekly show': Radio,
  archive: Radio,
  search: Search,
  artists: Users,
}

function getIconForLabel(label: string): IconComponent {
  return ICON_MAP[label.toLowerCase().trim()] ?? Home
}

interface MobileNavigationProps {
  navItems: NavItem[]
}

export function MobileNavigation({ navItems }: MobileNavigationProps) {
  const pathname = usePathname()

  // Mobile nav shows max 5 items to fit the bottom bar
  const visibleItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex md:hidden">
      {visibleItems.map((item) => {
        const Icon = getIconForLabel(item.label)
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-2 text-xs gap-1 transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
