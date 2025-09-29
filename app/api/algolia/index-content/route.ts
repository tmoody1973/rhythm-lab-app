import { NextRequest, NextResponse } from 'next/server'
import { adminClient, INDICES } from '@/lib/algolia/client'

export async function POST(request: NextRequest) {
  try {
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Algolia admin client not configured' },
        { status: 500 }
      )
    }

    // Get authentication (admin only)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Storyblok access
    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || process.env.STORYBLOK_ACCESS_TOKEN

    if (!storyblokToken) {
      return NextResponse.json(
        { error: 'Storyblok token not configured' },
        { status: 500 }
      )
    }

    // Fetch all published stories from Storyblok with better error handling using direct fetch
    // Note: Now including shows for searchable weekly show content
    const storyblokResponse = await Promise.race([
      fetch(`https://api.storyblok.com/v2/cdn/stories?version=published&per_page=100&sort_by=published_at:desc&token=${storyblokToken}`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storyblok API timeout after 15 seconds')), 15000)
      )
    ])

    if (!storyblokResponse.ok) {
      throw new Error(`Storyblok API error: ${storyblokResponse.status}`)
    }

    const data = await storyblokResponse.json()

    const stories = data?.stories || []

    if (stories.length === 0) {
      return NextResponse.json(
        { message: 'No stories found to index' },
        { status: 200 }
      )
    }

    // Transform stories into Algolia objects
    const algoliaObjects = stories
      .filter((story: any) => {
        // Filter out system/navigation content and unwanted components
        if (!story.full_slug || story.full_slug === 'home') return false
        if (story.content?.component === 'mobile_navigation') return false
        if (story.content?.component === 'navigation') return false
        if (story.content?.component === 'footer') return false
        if (story.content?.component === 'header') return false
        if (story.full_slug.includes('mobile_navigation')) return false
        if (story.full_slug.includes('config/')) return false

        // Only include content that has meaningful titles
        const title = getStoryTitle(story)
        if (!title || title === 'Untitled' || title.toLowerCase() === 'mobile_navigation') return false

        return true
      })
      .map((story: any) => {
        const publishedDate = story.published_at || story.created_at
        const publishDate = publishedDate ? new Date(publishedDate) : new Date()

        // Extract meaningful title
        const title = getStoryTitle(story)

        // Extract meaningful description
        const description = getStoryDescription(story)

        // Determine content type
        const contentType = getContentType(story.content?.component)

        // Extract tags and categories
        const tags = extractTags(story.content)
        const categories = extractCategories(story.content)

        return {
          objectID: `content_${story.id}`,

          // Primary search fields
          title: title,
          heading: story.content?.heading || story.content?.title || title,
          description: description,
          content: extractTextContent(story.content),

          // Storyblok metadata
          storyblok_id: story.id,
          slug: story.full_slug,
          component: story.content?.component || 'page',

          // Content classification
          content_type: contentType,
          categories: categories,
          tags: tags,

          // Author and attribution
          author: extractAuthor(story.content),

          // Temporal data
          published_at: publishDate.toISOString(),
          publish_timestamp: publishDate.getTime(),
          created_at: story.created_at,

          // Display formatting
          date_display: publishDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          relative_date: getRelativeDate(publishDate),

          // URL and navigation - fix routing based on content type
          url: generateCorrectUrl(story.full_slug, contentType),
          full_slug: story.full_slug,

          // SEO and social
          seo_title: story.content?.seo_title || title,
          seo_description: story.content?.seo_description || description,
          image: extractFeaturedImage(story.content),

          // Include the full featured_image object for the search interface
          featured_image: story.content?.featured_image || null,

          // Content-specific metadata
          ...extractSpecificMetadata(story.content, contentType),

          // Search optimization
          searchable_text: [
            title,
            description,
            extractTextContent(story.content),
            extractAuthor(story.content),
            ...tags,
            ...categories
          ].filter(Boolean).join(' '),

          // Display helpers
          display_title: title,
          display_context: getDisplayContext(contentType, publishDate, extractAuthor(story.content)),

          // Faceting helpers
          year: publishDate.getFullYear(),
          month: publishDate.getMonth() + 1,
          has_image: !!extractFeaturedImage(story.content),
          word_count: estimateWordCount(extractTextContent(story.content))
        }
      })

    // Index to Algolia
    console.log(`Indexing ${algoliaObjects.length} content pieces...`)

    const { taskID } = await adminClient.replaceAllObjects({
      indexName: INDICES.CONTENT,
      objects: algoliaObjects,
      batchSize: 1000
    })

    console.log(`Content indexing started with task ID: ${taskID}`)

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${algoliaObjects.length} content pieces for indexing`,
      taskID,
      indexed_count: algoliaObjects.length,
      content_types: [...new Set(algoliaObjects.map(obj => obj.content_type))],
      sample_object: algoliaObjects[0] // For debugging
    })

  } catch (error) {
    console.error('Content indexing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to index content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions for content extraction and transformation

function getStoryTitle(story: any): string {
  const possibleTitles = [
    story.content?.title,
    story.content?.name,
    story.content?.headline,
    story.content?.article_title,
    story.content?.show_title,
    story.content?.show_name,
    story.content?.program_name,
    story.content?.series_title,
    story.content?.artist_name,
    story.content?.episode_title,
    story.name,
    story.slug
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

function getStoryDescription(story: any): string {
  const possibleDescriptions = [
    story.content?.description,
    story.content?.summary,
    story.content?.intro,
    story.content?.excerpt,
    story.content?.bio,
    story.content?.teaser
  ].filter(Boolean)

  if (possibleDescriptions.length > 0) {
    const desc = possibleDescriptions[0]
    return desc.length > 300 ? desc.substring(0, 297) + '...' : desc
  }

  // Generate description based on content type
  const component = story.content?.component
  const title = getStoryTitle(story)

  switch (component) {
    case 'blog_post':
      return `Read "${title}" - Latest insights and analysis from Rhythm Lab Radio.`
    case 'deep_dive':
      return `Explore "${title}" - In-depth music analysis and cultural exploration.`
    case 'artist_profile':
      return `Discover ${title} - Artist profile, biography, and featured music.`
    case 'show':
    case 'episode':
      return `Listen to ${title} - Electronic music show featuring curated tracks and mixes.`
    default:
      return `${title} - Content from Rhythm Lab Radio music platform.`
  }
}

function getContentType(component: string): string {
  switch (component) {
    case 'blog_post':
      return 'blog_post'
    case 'deep_dive':
      return 'deep_dive'
    case 'artist_profile':
      return 'artist_profile'
    case 'show':
    case 'episode':
    case 'radio_show':
    case 'weekly_show':
    case 'program':
      return 'show'
    case 'page':
      return 'page'
    default:
      return 'content'
  }
}

function extractTags(content: any): string[] {
  const tags: string[] = []

  if (content?.tags) {
    if (Array.isArray(content.tags)) {
      tags.push(...content.tags)
    } else if (typeof content.tags === 'string') {
      tags.push(content.tags)
    }
  }

  if (content?.genre) {
    if (Array.isArray(content.genre)) {
      tags.push(...content.genre)
    } else {
      tags.push(content.genre)
    }
  }

  return tags.filter(Boolean)
}

function extractCategories(content: any): string[] {
  const categories: string[] = []

  if (content?.category) {
    categories.push(content.category)
  }

  if (content?.categories) {
    if (Array.isArray(content.categories)) {
      categories.push(...content.categories)
    } else {
      categories.push(content.categories)
    }
  }

  return categories.filter(Boolean)
}

function extractAuthor(content: any): string {
  return content?.author || content?.writer || content?.host || content?.dj_name || 'Rhythm Lab Radio'
}

function extractTextContent(content: any): string {
  // Extract text from various content fields
  const textFields = [
    content?.content,
    content?.body,
    content?.text,
    content?.description,
    content?.bio,
    content?.summary
  ].filter(Boolean)

  return textFields.join(' ').substring(0, 2000) // Limit for search performance
}

function extractFeaturedImage(content: any): string {
  const imageUrl = content?.featured_image?.filename ||
                   content?.image?.filename ||
                   content?.cover_image?.filename ||
                   content?.photo?.filename ||
                   content?.artist_photo?.filename ||
                   content?.hero_image?.filename || ''

  return imageUrl
}

function extractSpecificMetadata(content: any, contentType: string): any {
  const metadata: any = {}

  switch (contentType) {
    case 'artist_profile':
      metadata.artist_name = content?.artist_name || content?.name
      metadata.genres = content?.genres || []
      metadata.social_links = content?.social_links || []
      break

    case 'show':
      metadata.show_type = content?.show_type || 'regular'
      metadata.duration = content?.duration
      metadata.host = content?.host || content?.dj_name || content?.dj || content?.presenter
      metadata.schedule = content?.weekly_schedule || content?.schedule || content?.airtime
      metadata.day_of_week = content?.day_of_week || content?.broadcast_day
      metadata.time_slot = content?.time_slot || content?.broadcast_time
      metadata.genre = content?.genre || content?.music_genre
      metadata.description = content?.show_description || content?.description
      break

    case 'blog_post':
    case 'deep_dive':
      metadata.reading_time = Math.max(1, Math.ceil(estimateWordCount(extractTextContent(content)) / 200))
      metadata.topics = content?.topics || []
      break
  }

  return metadata
}

function getDisplayContext(contentType: string, publishDate: Date, author: string): string {
  const dateStr = publishDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  switch (contentType) {
    case 'blog_post':
      return `Blog Post • ${author} • ${dateStr}`
    case 'deep_dive':
      return `Deep Dive • ${author} • ${dateStr}`
    case 'artist_profile':
      return `Artist Profile • ${dateStr}`
    case 'show':
      return `Show • ${author} • ${dateStr}`
    default:
      return `${author} • ${dateStr}`
  }
}

function getRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length
}

function generateCorrectUrl(fullSlug: string, contentType: string): string {
  // Remove leading slash if present
  const slug = fullSlug.replace(/^\/+/, '')

  // Extract the actual slug (last part after any folder structure)
  const slugParts = slug.split('/')
  const actualSlug = slugParts[slugParts.length - 1]

  switch (contentType) {
    case 'deep_dive':
      return `/deep-dive/${actualSlug}`
    case 'blog_post':
      return `/blog/${actualSlug}`
    case 'artist_profile':
      return `/profiles/${actualSlug}`
    case 'show':
      return `/shows/${actualSlug}`
    default:
      // For other content types, use the original slug structure
      return `/${slug}`
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Storyblok Content Indexing',
    description: 'POST to this endpoint to index all Storyblok content to Algolia',
    requirements: ['Bearer token authorization', 'Admin permissions', 'Storyblok token'],
    data_source: 'Storyblok CMS (blog posts, deep dives, artist profiles, shows)',
    features: [
      'Smart title extraction from multiple fields',
      'Rich content classification and metadata',
      'Author attribution and temporal data',
      'SEO optimization with descriptions and images',
      'Content-specific metadata (reading time, genres, etc)',
      'Full-text search with relevance ranking'
    ]
  })
}