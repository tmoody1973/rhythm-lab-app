'use client'

import { useState, useEffect } from 'react'
import { Header } from "@/components/header"
import { Metadata } from 'next'
import { StoryblokStory } from '@storyblok/react/rsc'
import { storyblokComponents } from '@/components/storyblok/StoryblokComponents'

// Since we can't export metadata from a client component, we'll handle SEO differently
// You may want to move this to a server component wrapper if needed

interface AboutPageData {
  success: boolean
  story?: any
  message?: string
  error?: string
}

// Dynamic renderer for Storyblok content sections
const renderStoryblokSection = (section: any) => {
  const Component = storyblokComponents[section.component as keyof typeof storyblokComponents]

  if (!Component) {
    console.warn(`Component ${section.component} not found in storyblokComponents`)
    return null
  }

  return <Component key={section._uid} blok={section} />
}

export default function AboutPage() {
  const [aboutData, setAboutData] = useState<AboutPageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await fetch('/api/storyblok/about')
        const data = await response.json()
        setAboutData(data)

        if (data.success) {
          console.log('About page loaded from Storyblok:', data.message)
        } else {
          console.error('Failed to load About page:', data.error)
        }
      } catch (error) {
        console.error('Error fetching About page:', error)
        setAboutData({
          success: false,
          error: 'Failed to fetch About page content'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAboutData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-24 text-center">
            <div className="text-lg text-muted-foreground">Loading About page...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!aboutData?.success || !aboutData.story) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-24 text-center">
            <h1 className="text-2xl font-bold mb-4">Content Not Available</h1>
            <p className="text-muted-foreground mb-6">
              {aboutData?.error || 'About page content could not be loaded from Storyblok.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Please check that you've created an "About" story in Storyblok with the about_page component.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const story = aboutData.story
  const content = story.content

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Render all sections from Storyblok */}
        {content.hero_section?.map((section: any) => renderStoryblokSection(section))}
        {content.mission_section?.map((section: any) => renderStoryblokSection(section))}
        {content.host_section?.map((section: any) => renderStoryblokSection(section))}
        {content.what_we_do_section?.map((section: any) => renderStoryblokSection(section))}
        {content.philosophy_section?.map((section: any) => renderStoryblokSection(section))}
        {content.community_image_section?.map((section: any) => renderStoryblokSection(section))}
        {content.partner_stations_section?.map((section: any) => renderStoryblokSection(section))}
        {content.contact_section?.map((section: any) => renderStoryblokSection(section))}
        {content.footer_cta_section?.map((section: any) => renderStoryblokSection(section))}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="py-8 border-t border-border/20 mt-12">
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium">Debug: Storyblok Data</summary>
              <pre className="mt-4 p-4 bg-muted/10 rounded overflow-auto text-xs">
                {JSON.stringify(content, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </main>
    </div>
  )
}