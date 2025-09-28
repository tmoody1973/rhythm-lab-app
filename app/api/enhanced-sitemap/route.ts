import { getStoryblokApi } from '@storyblok/react/rsc'
import { NextResponse } from 'next/server'

interface EnhancedSitemapEntry {
  url: string
  title: string
  description: string
  lastModified: string
  publishedAt?: string
  contentType: string
  priority: number
  changeFrequency: string
  language?: string
  author?: string
  tags?: string[]
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rhythmlabradio.com'

  try {
    // Static pages with enhanced metadata
    const staticPages: EnhancedSitemapEntry[] = [
      {
        url: baseUrl,
        title: 'Rhythm Lab Radio - AI Music Discovery Platform',
        description: 'Discover electronic music, deep house, jazz fusion, and experimental sounds. Live streams, artist profiles, and AI-generated content.',
        lastModified: new Date().toISOString(),
        contentType: 'homepage',
        priority: 1.0,
        changeFrequency: 'daily',
        language: 'en'
      },
      {
        url: `${baseUrl}/search`,
        title: 'Search - Rhythm Lab Radio',
        description: 'Search for songs, shows, artists, and content across Rhythm Lab Radio.',
        lastModified: new Date().toISOString(),
        contentType: 'search',
        priority: 0.8,
        changeFrequency: 'weekly',
        language: 'en'
      },
      {
        url: `${baseUrl}/shows`,
        title: 'Shows - Rhythm Lab Radio',
        description: 'Explore our collection of live electronic music shows, DJ sets, and curated playlists.',
        lastModified: new Date().toISOString(),
        contentType: 'listing',
        priority: 0.9,
        changeFrequency: 'daily',
        language: 'en'
      },
      {
        url: `${baseUrl}/artists`,
        title: 'Artists - Rhythm Lab Radio',
        description: 'Discover electronic music artists, DJs, and producers featured on Rhythm Lab Radio.',
        lastModified: new Date().toISOString(),
        contentType: 'listing',
        priority: 0.8,
        changeFrequency: 'weekly',
        language: 'en'
      },
      {
        url: `${baseUrl}/blog`,
        title: 'Blog - Rhythm Lab Radio',
        description: 'Read the latest insights, reviews, and deep dives into electronic music culture.',
        lastModified: new Date().toISOString(),
        contentType: 'listing',
        priority: 0.7,
        changeFrequency: 'daily',
        language: 'en'
      }
    ]

    // Check if we have Storyblok access
    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || process.env.STORYBLOK_ACCESS_TOKEN

    if (!storyblokToken) {
      return NextResponse.json({
        sitemap: staticPages,
        generated: new Date().toISOString(),
        total: staticPages.length
      })
    }

    // Get Storyblok API
    const storyblokApi = getStoryblokApi()

    // Fetch all published stories from Storyblok
    const { data } = await Promise.race([
      storyblokApi.get('cdn/stories', {
        version: 'published',
        per_page: 100,
        sort_by: 'published_at:desc',
        token: storyblokToken
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Storyblok API timeout')), 10000)
      )
    ])

    const stories = data?.stories || []

    // Create enhanced sitemap entries for Storyblok content
    const storyblokPages: EnhancedSitemapEntry[] = stories
      .filter((story: any) => story.full_slug && story.full_slug !== 'home')
      .map((story: any) => {
        const title = getStoryTitle(story)
        const description = getStoryDescription(story)
        const contentType = getContentType(story.content?.component)
        const publishedDate = story.published_at || story.created_at

        return {
          url: `${baseUrl}/${story.full_slug}`,
          title,
          description,
          lastModified: new Date(publishedDate || new Date()).toISOString(),
          publishedAt: publishedDate ? new Date(publishedDate).toISOString() : undefined,
          contentType,
          priority: getPriority(story.content?.component, story.full_slug),
          changeFrequency: getChangeFrequency(story.content?.component),
          language: 'en',
          author: story.content?.author || 'Rhythm Lab Radio',
          tags: extractTags(story.content)
        }
      })

    const allPages = [...staticPages, ...storyblokPages]

    return NextResponse.json({
      sitemap: allPages,
      generated: new Date().toISOString(),
      total: allPages.length,
      breakdown: {
        static: staticPages.length,
        dynamic: storyblokPages.length
      }
    })

  } catch (error) {
    console.error('Error generating enhanced sitemap:', error)

    return NextResponse.json({
      sitemap: staticPages,
      generated: new Date().toISOString(),
      total: staticPages.length,
      error: 'Failed to fetch dynamic content'
    })
  }
}

// Helper functions (same as in sitemap.ts)
function getStoryTitle(story: any): string {
  const possibleTitles = [
    story.content?.title,
    story.content?.name,
    story.content?.headline,
    story.content?.artist_name,
    story.content?.show_title,
    story.content?.episode_title,
    story.name,
    story.slug
  ].filter(Boolean)

  if (possibleTitles.length > 0) {
    return possibleTitles[0]
  }

  const slug = story.full_slug || story.slug || ''
  return slug
    .split('/')
    .pop()
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Untitled'
}

function getStoryDescription(story: any): string {
  const possibleDescriptions = [
    story.content?.description,
    story.content?.summary,
    story.content?.intro,
    story.content?.bio,
    story.content?.excerpt,
    story.content?.teaser
  ].filter(Boolean)

  if (possibleDescriptions.length > 0) {
    const description = possibleDescriptions[0]
    return description.length > 160
      ? description.substring(0, 157) + '...'
      : description
  }

  const component = story.content?.component
  const title = getStoryTitle(story)

  switch (component) {
    case 'show':
    case 'episode':
      return `Listen to ${title} on Rhythm Lab Radio - Electronic music, deep house, and experimental sounds.`
    case 'artist':
    case 'artist_profile':
      return `Discover ${title} on Rhythm Lab Radio - Artist profile, music, and biography.`
    case 'blog_post':
      return `Read ${title} on Rhythm Lab Radio - Music insights, reviews, and culture.`
    case 'deep_dive':
      return `Explore ${title} - In-depth music analysis and cultural exploration from Rhythm Lab Radio.`
    default:
      return `${title} - Rhythm Lab Radio: Electronic music discovery platform.`
  }
}

function getContentType(component: string): string {
  switch (component) {
    case 'show':
    case 'episode':
      return 'show'
    case 'artist':
    case 'artist_profile':
      return 'artist'
    case 'blog_post':
      return 'article'
    case 'deep_dive':
      return 'deep-dive'
    default:
      return 'page'
  }
}

function getPriority(component: string, slug: string): number {
  if (slug === '') return 1.0
  if (component === 'show' || component === 'episode') return 0.9
  if (component === 'artist' || component === 'artist_profile') return 0.8
  if (component === 'blog_post' || component === 'deep_dive') return 0.7
  return 0.6
}

function getChangeFrequency(component: string): string {
  switch (component) {
    case 'show':
    case 'episode':
      return 'daily'
    case 'artist':
    case 'artist_profile':
      return 'weekly'
    case 'blog_post':
    case 'deep_dive':
      return 'monthly'
    default:
      return 'weekly'
  }
}

function extractTags(content: any): string[] {
  const tags: string[] = []

  if (content?.tags) {
    tags.push(...(Array.isArray(content.tags) ? content.tags : [content.tags]))
  }

  if (content?.genre) {
    tags.push(...(Array.isArray(content.genre) ? content.genre : [content.genre]))
  }

  if (content?.category) {
    tags.push(content.category)
  }

  return tags.filter(Boolean)
}