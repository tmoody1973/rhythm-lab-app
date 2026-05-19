# Sanity-Driven Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the header and mobile navigation to fetch nav items from the Sanity `siteSettings` singleton, with a hardcoded fallback when Sanity returns nothing.

**Architecture:** Convert `Header` into an async server component that fetches nav items via a shared `getNavItems()` helper and passes them to a new `HeaderClient` subcomponent (which keeps the existing state/auth logic). Apply the same server-fetch + client-render split to the mobile nav. Mobile nav icons are mapped from `label` strings in code (editors don't manage icons in Sanity).

**Tech Stack:** Next.js 15 App Router (async server components), `@sanity/client`, lucide-react icons

---

## File Map

**Created:**
- `lib/sanity/nav.ts` — `getNavItems()` server function: fetches Sanity siteSettings.navItems with hardcoded fallback
- `components/header-client.tsx` — Client-side header: handles search modal, Clerk user dropdown, mobile sheet menu, renders nav items from props
- `components/mobile-navigation.tsx` — Client-side mobile bottom nav: renders items from props with icon mapping

**Modified:**
- `components/header.tsx` — Converted from client to async server component that fetches nav and renders `<HeaderClient>` with nav items as props
- `components/mobile-navigation-wrapper.tsx` — Converted from client to async server component that fetches nav and renders `<MobileNavigation>` with items as props

**Unchanged but uses new pattern:**
- All pages that render `<Header />` — no changes needed, the JSX call stays the same; only Header's internals change

---

## Task 1: Create the shared nav fetcher

**Files:**
- Create: `lib/sanity/nav.ts`

- [ ] **Step 1: Create `lib/sanity/nav.ts`**

```typescript
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
      // Filter out any malformed items (missing label or href)
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
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/tarikmoody/Documents/Projects/rhythm-lab-app/rhythm-lab-app
npx tsc --noEmit 2>&1 | grep "lib/sanity/nav" | head -5
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add lib/sanity/nav.ts
git commit -m "feat: add getNavItems() Sanity fetcher with hardcoded fallback"
```

---

## Task 2: Extract Header client logic into HeaderClient subcomponent

**Files:**
- Create: `components/header-client.tsx`

- [ ] **Step 1: Read the current Header file**

```bash
cat /Users/tarikmoody/Documents/Projects/rhythm-lab-app/rhythm-lab-app/components/header.tsx
```

The current Header is a client component with: search modal state, Clerk `useUser` for sign-in display, a desktop nav (hardcoded Links), and a mobile Sheet menu. We're going to move the entire current Header body into a new `HeaderClient` component that accepts `navItems` as a prop.

- [ ] **Step 2: Create `components/header-client.tsx`**

```typescript
'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchModal } from "@/components/search-modal"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Image from "next/image"
import { useUser, SignOutButton } from "@clerk/nextjs"
import type { NavItem } from "@/lib/sanity/nav"

interface HeaderClientProps {
  navItems: NavItem[]
}

export function HeaderClient({ navItems }: HeaderClientProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/rlr-selector-logo.png"
                  alt="Rhythm Lab Radio"
                  width={192}
                  height={64}
                  className="h-12 w-auto sm:h-16"
                  priority
                />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="nts-text-caps text-sm font-bold hover:bg-transparent hover:text-gray-700 px-0 text-black"
                    style={{ color: "#000000" }}
                  >
                    {item.label.toUpperCase()}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent"
                >
                  <span className="text-lg">🔍</span>
                </Button>
              </Link>

              <div className="hidden md:flex items-center gap-3">
                {!mounted || !isLoaded ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : user ? (
                  <div className="flex items-center gap-3">
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background text-sm px-4 py-2"
                      >
                        Profile
                      </Button>
                    </Link>
                    <SignOutButton>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground hover:bg-foreground/10 text-sm px-4 py-2"
                      >
                        Sign Out
                      </Button>
                    </SignOutButton>
                  </div>
                ) : (
                  <>
                    <Link href="/sign-in">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background text-sm px-4 py-2"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        size="sm"
                        className="bg-foreground text-background hover:bg-foreground/90 text-sm px-4 py-2"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100 transition-colors">
                      <span className="text-xl">☰</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white border-l border-border/20 shadow-2xl w-80 p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full">
                      <div className="p-6 border-b border-border/20">
                        <div className="flex items-center">
                          <Image
                            src="/images/rlr-selector-logo.png"
                            alt="Rhythm Lab Radio"
                            width={144}
                            height={48}
                            className="h-10 w-auto"
                          />
                        </div>
                      </div>
                      <nav className="flex-1 p-6 space-y-1">
                        {navItems.map((item) => (
                          <Link key={item.href} href={item.href} className="block">
                            <div className="px-4 py-3 text-sm font-bold uppercase text-black hover:bg-gray-100 rounded transition-colors">
                              {item.label}
                            </div>
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "header-client" | head -5
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add components/header-client.tsx
git commit -m "feat: extract HeaderClient with navItems prop support"
```

---

## Task 3: Convert Header to async server component

**Files:**
- Modify: `components/header.tsx`

- [ ] **Step 1: Replace the entire `components/header.tsx` content**

```typescript
import { getNavItems } from "@/lib/sanity/nav"
import { HeaderClient } from "@/components/header-client"

export async function Header() {
  const navItems = await getNavItems()
  return <HeaderClient navItems={navItems} />
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "header\.tsx" | head -5
```

Expected: no output

- [ ] **Step 3: Verify the dev server still runs and the header renders**

```bash
npm run dev > /tmp/nextjs.log 2>&1 &
sleep 8
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/blog
```

Expected: `200`

Kill the dev server when done:
```bash
pkill -f "next dev"
```

- [ ] **Step 4: Commit**

```bash
git add components/header.tsx
git commit -m "feat: convert Header to async server component, nav from Sanity"
```

---

## Task 4: Create MobileNavigation client component with icon map

**Files:**
- Create: `components/mobile-navigation.tsx`

- [ ] **Step 1: Create `components/mobile-navigation.tsx`**

```typescript
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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "mobile-navigation\.tsx" | head -5
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add components/mobile-navigation.tsx
git commit -m "feat: add MobileNavigation client component with label-to-icon mapping"
```

---

## Task 5: Convert MobileNavigationWrapper to async server component

**Files:**
- Modify: `components/mobile-navigation-wrapper.tsx`

- [ ] **Step 1: Replace the entire `components/mobile-navigation-wrapper.tsx` content**

```typescript
import { getNavItems } from '@/lib/sanity/nav'
import { MobileNavigation } from '@/components/mobile-navigation'

export default async function MobileNavigationWrapper() {
  const navItems = await getNavItems()
  return <MobileNavigation navItems={navItems} />
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "mobile-navigation-wrapper" | head -5
```

Expected: no output

- [ ] **Step 3: Verify mobile nav still renders**

```bash
npm run dev > /tmp/nextjs.log 2>&1 &
sleep 8
# Fetch the homepage and check the mobile nav HTML is in there
curl -s http://localhost:3000/ | grep -o "Episodes\|Profiles\|Search" | head -3
pkill -f "next dev"
```

Expected: output includes `Episodes`, `Profiles`, `Search` (mobile nav labels from defaults — the siteSettings singleton in Sanity is empty so fallback is used)

- [ ] **Step 4: Commit**

```bash
git add components/mobile-navigation-wrapper.tsx
git commit -m "feat: convert MobileNavigationWrapper to async server component, nav from Sanity"
```

---

## Task 6: Populate the siteSettings singleton in Sanity Studio

This is a manual step performed in Sanity Studio — no code change. After the code is deployed, the editor populates `siteSettings.navItems` so it overrides the hardcoded defaults.

- [ ] **Step 1: Open Sanity Studio**

Navigate to `https://rhythmlab.sanity.studio` in your browser.

- [ ] **Step 2: Open or create the Site Settings singleton**

Click **Site Settings** in the left sidebar. If no document exists, click **+ Create** to make one.

- [ ] **Step 3: Add navigation items**

Set the **Site Title** field to `Rhythm Lab Radio`.

In the **Navigation Items** array, add these items in order (one entry per item, with Label and URL fields):

| Label | URL |
|-------|-----|
| Home | / |
| Live | /live |
| Blog | /blog |
| Deep Dives | /deep-dives |
| Episodes | /episodes |
| Profiles | /profiles |
| About | /about |
| Weekly Show | /archive |
| Search | /search |

- [ ] **Step 4: Click Publish**

Hit the blue **Publish** button. The Sanity webhook fires, the Next.js cache revalidates, and within a minute the live nav reads from this list instead of the code defaults.

- [ ] **Step 5: Verify on the live site**

Open `https://www.rhythmlabradio.com/` and confirm the header nav matches your Sanity list. If you edit the list in Studio (rename, reorder, add, remove), publish, and refresh — the change appears within ~30 seconds.

---

## Self-Review

**Spec coverage:**
- ✅ Header reads from Sanity siteSettings.navItems with fallback — Tasks 1, 2, 3
- ✅ Mobile nav reads from Sanity siteSettings.navItems with fallback — Tasks 1, 4, 5
- ✅ Same nav items used for desktop and mobile — both call `getNavItems()`
- ✅ Mobile icons mapped from label in code — Task 4 `ICON_MAP`
- ✅ Editor can populate Sanity siteSettings — Task 6 instructions

**Type consistency:**
- `NavItem` type defined in Task 1 (`lib/sanity/nav.ts`), imported by Tasks 2 and 4 ✓
- `getNavItems()` function defined in Task 1, called in Tasks 3 and 5 ✓
- `HeaderClient` defined in Task 2 with `navItems: NavItem[]` prop, used in Task 3 ✓
- `MobileNavigation` defined in Task 4 with `navItems: NavItem[]` prop, used in Task 5 ✓

**Notes on what's NOT in this plan:**
- About page content — already wired (`app/about/page.tsx` calls `sanityFetch` with `ABOUT_PAGE_QUERY`). It just needs content added in Studio. No code change needed.
- Publishing workflow for blog/deep-dives/profiles — editorial action in Studio, no code change. After this plan, all drafts in those types can be published by clicking Publish in Studio.
