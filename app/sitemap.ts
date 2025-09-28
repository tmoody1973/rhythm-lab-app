import { getStoryblokApi } from '@storyblok/react/rsc'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rhythmlabradio.com'

  // Static pages that should always be included
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shows`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }
  ]

  try {
    // Check if we have the required environment variables
    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || process.env.STORYBLOK_ACCESS_TOKEN

    if (!storyblokToken) {
      console.log('Storyblok token not found, returning static URLs only')
      return staticUrls
    }

    // Get Storyblok API with error handling
    const storyblokApi = getStoryblokApi()

    // Fetch all published stories from Storyblok with timeout and retry logic
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

    if (stories.length === 0) {
      console.log('No stories found in Storyblok, returning static URLs only')
      return staticUrls
    }

    // Create sitemap entries for Storyblok content with enhanced metadata
    const storyblokUrls: MetadataRoute.Sitemap = stories
      .filter((story: any) => story.full_slug && story.full_slug !== 'home')
      .map((story: any) => {
        // Extract meaningful title from story
        const title = getStoryTitle(story)
        const description = getStoryDescription(story)
        const publishedDate = story.published_at || story.created_at

        // Log the content for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`Sitemap entry: ${story.full_slug} - ${title}`)
        }

        return {
          url: `${baseUrl}/${story.full_slug}`,
          lastModified: new Date(publishedDate || new Date()),
          changeFrequency: getChangeFrequency(story.content?.component),
          priority: getPriority(story.content?.component, story.full_slug),
          // Note: Next.js sitemap doesn't support title/description in XML output
          // but we can use this data for enhanced sitemap generation
        }
      })

    console.log(`Generated sitemap with ${staticUrls.length} static URLs and ${storyblokUrls.length} Storyblok URLs`)

    // Combine all URLs
    return [...staticUrls, ...storyblokUrls]

  } catch (error) {
    console.error('Error generating sitemap from Storyblok:', error)
    console.log('Falling back to static URLs only')

    // Fallback: return static pages if Storyblok fails
    return staticUrls
  }
}

// Helper function to determine how often content changes based on content type
function getChangeFrequency(component: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  switch (component) {
    case 'show':
    case 'episode':
      return 'daily' // Shows and episodes change frequently
    case 'artist':
    case 'artist_profile':
      return 'weekly' // Artist profiles updated less frequently
    case 'blog_post':
    case 'deep_dive':
      return 'monthly' // Blog content is more static once published
    case 'page':
    default:
      return 'weekly' // Default for other page types
  }
}

// Helper function to assign priority based on content type and URL
function getPriority(component: string, slug: string): number {
  // Homepage gets highest priority
  if (slug === '') return 1.0

  // High priority content
  if (component === 'show' || component === 'episode') return 0.9
  if (component === 'artist' || component === 'artist_profile') return 0.8

  // Medium priority content
  if (component === 'blog_post' || component === 'deep_dive') return 0.7

  // Standard priority for other pages
  return 0.6
}

// Helper function to extract meaningful title from Storyblok story
function getStoryTitle(story: any): string {
  // Try multiple sources for the title
  const possibleTitles = [
    story.content?.title,
    story.content?.name,
    story.content?.headline,
    story.content?.artist_name, // For artist profiles
    story.content?.show_title,  // For shows
    story.content?.episode_title, // For episodes
    story.name, // Storyblok story name
    story.slug // URL slug as last resort
  ].filter(Boolean)

  if (possibleTitles.length > 0) {
    return possibleTitles[0]
  }

  // Extract from slug if no title found
  const slug = story.full_slug || story.slug || ''
  return slug
    .split('/')
    .pop()
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Untitled'
}

// Helper function to extract description from Storyblok story
function getStoryDescription(story: any): string {
  // Try multiple sources for description
  const possibleDescriptions = [
    story.content?.description,
    story.content?.summary,
    story.content?.intro,
    story.content?.bio, // For artist profiles
    story.content?.excerpt,
    story.content?.teaser
  ].filter(Boolean)

  if (possibleDescriptions.length > 0) {
    // Truncate to reasonable length for SEO
    const description = possibleDescriptions[0]
    return description.length > 160
      ? description.substring(0, 157) + '...'
      : description
  }

  // Generate description based on content type
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