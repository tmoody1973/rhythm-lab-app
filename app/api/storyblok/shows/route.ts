import { NextRequest, NextResponse } from 'next/server'

interface StoryblokShow {
  id: string
  name: string
  slug: string
  content: {
    component: string
    title: string
    description: string
    published_date: string
    mixcloud_url: string
    mixcloud_embed: string
    mixcloud_picture: string | { filename?: string; url?: string; alt?: string } // Can be string (old) OR Asset object (new)
    tracklist: string | any[] // Can be JSON string (old) OR Blocks array (new)
    show_id: string
  }
  published_at: string
  created_at: string
}

interface StoryblokResponse {
  stories: StoryblokShow[]
  total: number
}

interface ShowsResponse {
  success: boolean
  shows?: any[]
  total_count?: number
  message?: string
  error?: string
}

/**
 * GET /api/storyblok/shows
 * Fetch shows from Storyblok with optional filtering and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : null
    const perPage = parseInt(searchParams.get('per_page') || '50', 10) // Fetch more stories to ensure we have enough mixcloud_show stories
    const search = searchParams.get('search') || ''

    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN

    if (!storyblokToken) {
      return NextResponse.json({
        success: false,
        error: 'Storyblok access token not configured'
      }, { status: 500 })
    }

    // Build Storyblok API URL
    const params = new URLSearchParams({
      token: storyblokToken,
      version: 'published',
      page: page.toString(),
      per_page: perPage.toString(),
      sort_by: 'published_at:desc'
    })

    // Add search if provided
    if (search) {
      params.set('search_term', search)
    }

    console.log('Fetching from Storyblok:', `https://api.storyblok.com/v2/cdn/stories?${params}`)

    const response = await fetch(`https://api.storyblok.com/v2/cdn/stories?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rhythm Lab Radio App'
      }
    })

    if (!response.ok) {
      console.error('Storyblok API error:', response.status, response.statusText)
      return NextResponse.json({
        success: false,
        error: `Storyblok API error: ${response.status}`
      }, { status: response.status })
    }

    const data: StoryblokResponse = await response.json()

    // Filter for mixcloud_show components and transform to our format
    const mixcloudStories = data.stories?.filter(story => story.content?.component === 'mixcloud_show') || []

    // Apply the limit after filtering (since we fetched more stories to ensure we have enough mixcloud_show stories)
    const limitedMixcloudStories = limit ? mixcloudStories.slice(0, limit) : mixcloudStories

    const transformedShows = limitedMixcloudStories.map(story => {
      // Parse tracklist - handle both old (JSON string) and new (Blocks array) formats
      let tracks = []
      let trackCount = 0
      try {
        if (story.content.tracklist) {
          if (typeof story.content.tracklist === 'string') {
            // OLD FORMAT: JSON string - parse it
            tracks = JSON.parse(story.content.tracklist)
          } else if (Array.isArray(story.content.tracklist)) {
            // NEW FORMAT: Blocks array - use directly
            tracks = story.content.tracklist
          }
          trackCount = Array.isArray(tracks) ? tracks.length : 0
        }
      } catch (e) {
        console.warn('Failed to parse tracklist for story:', story.id, e)
      }

      return {
        id: story.id,
        storyblok_id: story.id,
        title: story.content.title || story.name,
        description: story.content.description || '',
        published_date: story.content.published_date || story.published_at,
        mixcloud_picture: extractImageUrl(story.content.mixcloud_picture),
        mixcloud_url: story.content.mixcloud_url || '',
        mixcloud_embed: story.content.mixcloud_embed || '',
        duration_formatted: extractDuration(story.content.title, story.content.description),
        track_count: trackCount,
        tracks: tracks,
        tags: extractTags(story.content.title, story.content.description),
        slug: story.slug,
        show_id: story.content.show_id || story.id
      }
    })

    // Sort by published_date (newest first) - use the custom published_date from content
    // This ensures consistent sorting regardless of Storyblok's published_at vs our custom date
    transformedShows.sort((a, b) => {
      const dateA = new Date(a.published_date)
      const dateB = new Date(b.published_date)
      return dateB.getTime() - dateA.getTime() // Newest first (descending order)
    })

    return NextResponse.json({
      success: true,
      shows: transformedShows,
      total_count: data.total || 0,
      message: `Found ${transformedShows.length} shows from Storyblok`
    })

  } catch (error) {
    console.error('Storyblok shows API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Extract duration from title or description
 */
function extractDuration(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase()

  // Look for patterns like "2h 15m", "1:30:45", "90 minutes", etc.
  const patterns = [
    /(\d+)h\s*(\d+)m/i,
    /(\d+):\d{2}:\d{2}/,
    /(\d+)\s*minutes?/i,
    /(\d+)\s*mins?/i,
    /(\d+)\s*hours?/i,
    /(\d+)h/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (pattern.source.includes('h') && pattern.source.includes('m')) {
        return `${match[1]}h ${match[2]}m`
      }
      if (pattern.source.includes(':')) {
        return match[0]
      }
      if (pattern.source.includes('minute')) {
        const mins = parseInt(match[1])
        if (mins >= 60) {
          const hours = Math.floor(mins / 60)
          const remainingMins = mins % 60
          return `${hours}h ${remainingMins}m`
        }
        return `${mins}m`
      }
      if (pattern.source.includes('hour')) {
        return `${match[1]}h`
      }
      if (match[1]) {
        return `${match[1]}h`
      }
    }
  }

  return 'Unknown'
}

/**
 * Extract tags from title and description
 */
function extractTags(title: string, description: string): string[] {
  const tags: string[] = []
  const text = `${title} ${description}`.toLowerCase()

  // Common music genres and styles
  const genreKeywords = [
    'ambient', 'techno', 'house', 'deep house', 'jazz', 'fusion', 'electronic',
    'experimental', 'drone', 'minimal', 'underground', 'hip hop', 'hip-hop',
    'soul', 'funk', 'disco', 'breaks', 'drum & bass', 'dnb', 'garage',
    'dubstep', 'trap', 'afrobeat', 'latin', 'world', 'classical', 'rock',
    'indie', 'alternative', 'pop', 'reggae', 'dub', 'dancehall'
  ]

  genreKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword.toUpperCase())
    }
  })

  // Add some default tags based on patterns
  if (title.toLowerCase().includes('radio')) {
    tags.push('RADIO')
  }
  if (title.toLowerCase().includes('mix')) {
    tags.push('MIX')
  }
  if (title.toLowerCase().includes('live')) {
    tags.push('LIVE')
  }

  // Return unique tags, max 3
  return [...new Set(tags)].slice(0, 3)
}

/**
 * Extract image URL from Storyblok Asset field or text field
 * Handles both old format (string URL) and new format (Asset object)
 */
function extractImageUrl(imageField: any): string {
  if (!imageField) {
    return ''
  }

  // If it's a string (old format), return as-is
  if (typeof imageField === 'string') {
    return imageField
  }

  // If it's an Asset object (new format), extract the URL
  if (typeof imageField === 'object' && imageField.filename) {
    // Storyblok assets come with full URL in filename
    return imageField.filename
  }

  // If it's an Asset object with alt text but no filename (edge case)
  if (typeof imageField === 'object' && imageField.url) {
    return imageField.url
  }

  console.warn('Unknown image field format:', imageField)
  return ''
}