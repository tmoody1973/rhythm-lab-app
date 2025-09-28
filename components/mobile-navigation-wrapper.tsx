'use client'

import { useState, useEffect } from 'react'
import { storyblokComponents } from '@/components/storyblok/StoryblokComponents'

interface MobileNavData {
  success: boolean
  story?: any
  message?: string
  error?: string
}

// Dynamic renderer for Storyblok mobile navigation
const renderMobileNavigation = (content: any) => {
  const Component = storyblokComponents['mobile_navigation' as keyof typeof storyblokComponents]

  if (!Component) {
    console.warn(`Mobile navigation component not found in storyblokComponents`)
    return null
  }

  console.log('Rendering mobile navigation with content:', content)
  console.log('Menu items:', content.menu_items)

  return <Component blok={content} />
}

export default function MobileNavigationWrapper() {
  const [navData, setNavData] = useState<MobileNavData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const response = await fetch('/api/storyblok/mobile-nav')
        const data = await response.json()
        setNavData(data)

        if (data.success) {
          console.log('Mobile navigation loaded from Storyblok:', data.message)
        } else {
          console.error('Failed to load mobile navigation:', data.error)
        }
      } catch (error) {
        console.error('Error fetching mobile navigation:', error)
        setNavData({
          success: false,
          error: 'Failed to fetch mobile navigation content'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNavData()
  }, [])

  // Show fallback navigation if Storyblok data fails to load
  if (loading || !navData?.success || !navData.story) {
    // Fallback navigation with basic menu items
    const fallbackContent = {
      menu_items: [
        {
          _uid: 'home',
          menu_label: 'Home',
          menu_link: { url: '/' },
          icon: { filename: 'home-icon.svg' }
        },
        {
          _uid: 'shows',
          menu_label: 'Weekly Show',
          menu_link: { url: '/shows' },
          icon: { filename: 'music-icon.svg' }
        },
        {
          _uid: 'artists',
          menu_label: 'Artist Profiles',
          menu_link: { url: '/artists' },
          icon: { filename: 'user-icon.svg' }
        },
        {
          _uid: 'search',
          menu_label: 'Deep Dives',
          menu_link: { url: '/search' },
          icon: { filename: 'search-icon.svg' }
        },
        {
          _uid: 'blog',
          menu_label: 'Blog',
          menu_link: { url: '/blog' },
          icon: { filename: 'chat-icon.svg' }
        }
      ]
    }

    if (loading) {
      return null // Still loading, don't show anything yet
    }

    return renderMobileNavigation(fallbackContent)
  }

  const content = navData.story.content

  return renderMobileNavigation(content)
}