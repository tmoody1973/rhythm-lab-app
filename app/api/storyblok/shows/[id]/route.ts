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
    mixcloud_picture: string
    tracklist: string | any[] // Can be JSON string (old) OR Blocks array (new)
    show_id: string
  }
  published_at: string
  created_at: string
}

interface ShowDetailResponse {
  success: boolean
  show?: any
  tracks?: any[]
  message?: string
  error?: string
}

/**
 * GET /api/storyblok/shows/[id]
 * Fetch individual show with tracks from Storyblok
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: showId } = await params

    if (!showId) {
      return NextResponse.json({
        success: false,
        error: 'Show ID is required'
      }, { status: 400 })
    }

    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN

    if (!storyblokToken) {
      return NextResponse.json({
        success: false,
        error: 'Storyblok access token not configured'
      }, { status: 500 })
    }

    // Fetch from Storyblok by story ID or slug - try full path first for slugs
    let storyblokPath = showId

    // If it looks like a slug (contains dashes), try with 'shows/' prefix
    if (showId.includes('-')) {
      storyblokPath = `shows/${showId}`
    }

    const response = await fetch(`https://api.storyblok.com/v2/cdn/stories/${storyblokPath}?token=${storyblokToken}&version=published`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rhythm Lab Radio App'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Show not found'
        }, { status: 404 })
      }

      console.error('Storyblok API error:', response.status, response.statusText)
      return NextResponse.json({
        success: false,
        error: `Storyblok API error: ${response.status}`
      }, { status: response.status })
    }

    const data = await response.json()
    const story: StoryblokShow = data.story

    if (!story || story.content.component !== 'mixcloud_show') {
      return NextResponse.json({
        success: false,
        error: 'Show not found or invalid content type'
      }, { status: 404 })
    }

    // Parse tracks from tracklist - handle both old (JSON string) and new (Blocks array) formats
    let tracks = []
    try {
      if (story.content.tracklist) {
        let rawTracks: any[] = []

        // Check if tracklist is a string (old format) or array (new format)
        if (typeof story.content.tracklist === 'string') {
          // OLD FORMAT: JSON string - parse it
          console.log('Processing old format tracklist (JSON string) for story:', story.id)
          rawTracks = JSON.parse(story.content.tracklist)
        } else if (Array.isArray(story.content.tracklist)) {
          // NEW FORMAT: Blocks array - use directly
          console.log('Processing new format tracklist (Blocks array) for story:', story.id)
          rawTracks = story.content.tracklist
        } else {
          console.warn('Unexpected tracklist format for story:', story.id, typeof story.content.tracklist)
        }

        // Transform tracks to match expected format (same for both old and new)
        tracks = rawTracks.map((track: any, index: number) => ({
          id: track._uid || `track_${index}`,
          position: track.position || index + 1,
          artist: track.artist || 'Unknown Artist',
          track: track.track || 'Unknown Track',
          time_formatted: formatTrackTime(track.hour || 0, index),
          start_time: (track.hour || 0) * 3600 + index * 180, // Rough estimate
          spotify_url: track.spotify_url || '',
          youtube_url: track.youtube_url || '',
          discogs_url: track.discogs_url || ''
        }))
      }
    } catch (e) {
      console.warn('Failed to parse tracklist for story:', story.id, e)
      tracks = []
    }

    // Transform show data
    const transformedShow = {
      id: story.id,
      storyblok_id: story.id,
      title: story.content.title || story.name,
      description: story.content.description || '',
      published_date: story.content.published_date || story.published_at,
      mixcloud_picture: story.content.mixcloud_picture || '',
      mixcloud_url: story.content.mixcloud_url || '',
      mixcloud_embed: story.content.mixcloud_embed || '',
      duration_formatted: extractDuration(story.content.title, story.content.description),
      track_count: tracks.length,
      tags: extractTags(story.content.title, story.content.description),
      slug: story.slug,
      show_id: story.content.show_id || story.id,
      published_date_formatted: story.content.published_date
        ? new Date(story.content.published_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date(story.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
    }

    return NextResponse.json({
      success: true,
      show: transformedShow,
      tracks: tracks,
      message: `Found show: ${transformedShow.title}`
    })

  } catch (error) {
    console.error('Storyblok show detail API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Format track time from hour and index
 */
function formatTrackTime(hour: number, index: number): string {
  // Rough estimate: each track is about 3 minutes apart
  const totalMinutes = (hour * 60) + (index * 3)
  const minutes = Math.floor(totalMinutes)
  const seconds = Math.floor((totalMinutes % 1) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

  // Return unique tags, max 4
  return [...new Set(tags)].slice(0, 4)
}