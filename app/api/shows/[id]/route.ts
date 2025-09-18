import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

interface ShowDetailResponse {
  success: boolean
  show?: any
  tracks?: any[]
  message?: string
  error?: string
}

/**
 * GET /api/shows/[id]
 * Fetch individual show with tracks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const showId = params.id

    if (!showId) {
      return NextResponse.json({
        success: false,
        error: 'Show ID is required'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    // Fetch show details
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single()

    if (showError || !show) {
      return NextResponse.json({
        success: false,
        error: 'Show not found'
      }, { status: 404 })
    }

    // Fetch tracks for this show
    const { data: tracks, error: tracksError } = await supabase
      .from('mixcloud_tracks')
      .select('*')
      .eq('show_id', showId)
      .order('position', { ascending: true })

    if (tracksError) {
      console.error('Error fetching tracks:', tracksError)
      // Continue without tracks rather than failing completely
    }

    // Transform show data
    const transformedShow = {
      ...show,
      duration_formatted: show.duration ? formatDuration(show.duration) : null,
      tags: extractTags(show.title, show.description),
      published_date_formatted: new Date(show.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      track_count: tracks?.length || 0
    }

    // Transform tracks data
    const transformedTracks = tracks?.map(track => ({
      ...track,
      // Convert start_time seconds to MM:SS format
      time_formatted: track.start_time ? formatTrackTime(track.start_time) : '00:00'
    })) || []

    return NextResponse.json({
      success: true,
      show: transformedShow,
      tracks: transformedTracks,
      message: `Found show: ${show.title}`
    })

  } catch (error) {
    console.error('Show detail API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * Format duration from seconds to human readable
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Format track start time from seconds to MM:SS
 */
function formatTrackTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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