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

    console.log(`[Shows API] Looking for show with ID/slug: "${showId}"`)

    // Extract numeric ID from end of slug if present (e.g., "title-123" -> "123")
    let numericId = null
    const lastPart = showId.split('-').pop()
    if (lastPart && /^\d+$/.test(lastPart)) {
      numericId = lastPart
      console.log(`[Shows API] Extracted numeric ID: "${numericId}"`)
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

    // Fetch show details - try by ID first, then by slug if it fails
    let show, showError

    // First try as UUID (direct ID lookup)
    console.log(`[Shows API] Trying UUID lookup: "${showId}"`)
    const idResult = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single()

    console.log(`[Shows API] UUID result:`, idResult.data ? 'FOUND' : 'NOT FOUND')

    if (idResult.data) {
      show = idResult.data
      showError = null
    } else {
      // If ID lookup fails, try as slug
      console.log(`[Shows API] Trying slug lookup: "${showId}"`)
      const slugResult = await supabase
        .from('shows')
        .select('*')
        .eq('slug', showId)
        .single()

      console.log(`[Shows API] Slug result:`, slugResult.data ? 'FOUND' : 'NOT FOUND')

      if (slugResult.data) {
        show = slugResult.data
        showError = null
      } else {
        // If slug fails, try multiple approaches to find the show
        let found = false

        // First try: numeric ID from slug as storyblok_id
        if (numericId) {
          console.log(`[Shows API] Trying storyblok_id lookup: "${numericId}"`)
          const storyblokResult = await supabase
            .from('shows')
            .select('*')
            .eq('storyblok_id', numericId)
            .limit(1)

          if (storyblokResult.data && storyblokResult.data.length > 0) {
            show = storyblokResult.data[0]
            showError = null
            found = true
            console.log(`[Shows API] Found by storyblok_id: ${numericId}`)
          }
        }

        // Second try: look up by slug pattern in the slug field
        if (!found) {
          console.log(`[Shows API] Trying slug pattern lookup`)
          const slugResult = await supabase
            .from('shows')
            .select('*')
            .ilike('slug', `%${showId}%`)
            .limit(1)

          if (slugResult.data && slugResult.data.length > 0) {
            show = slugResult.data[0]
            showError = null
            found = true
            console.log(`[Shows API] Found by slug pattern`)
          } else {
            // Third try: match by title keywords (jones girls, quincy jones, bobbi humphrey, massive attack)
            console.log(`[Shows API] Trying title keyword lookup`)
            const titleResult = await supabase
              .from('shows')
              .select('*')
              .ilike('title', '%jones girls%')
              .ilike('title', '%quincy jones%')
              .ilike('title', '%bobbi humphrey%')
              .ilike('title', '%massive attack%')
              .limit(1)

            if (titleResult.data && titleResult.data.length > 0) {
              show = titleResult.data[0]
              showError = null
              found = true
              console.log(`[Shows API] Found by title keywords`)
            }
          }
        }

        console.log(`[Shows API] Final result:`, found ? 'FOUND' : 'NOT FOUND')
        if (!found) {
          showError = { message: 'Show not found' }
        }
      }
    }

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
      .eq('show_id', show.id)
      .order('position', { ascending: true })

    if (tracksError) {
      console.error('Error fetching tracks:', tracksError)
      // Continue without tracks rather than failing completely
    }

    // Sync missing image from Storyblok if needed
    let finalShow = { ...show }
    if (!show.mixcloud_picture && show.storyblok_id) {
      console.log(`[Shows API] Missing image, fetching from Storyblok ID: ${show.storyblok_id}`)
      try {
        const storyblokImage = await fetchImageFromStoryblok(show.storyblok_id)
        if (storyblokImage) {
          console.log(`[Shows API] Found image from Storyblok: ${storyblokImage}`)

          // Update Supabase with the image for future use
          await supabase
            .from('shows')
            .update({ mixcloud_picture: storyblokImage })
            .eq('id', show.id)

          finalShow.mixcloud_picture = storyblokImage
        }
      } catch (error) {
        console.error('Error fetching image from Storyblok:', error)
      }
    }

    // Transform show data
    const transformedShow = {
      ...finalShow,
      duration_formatted: finalShow.duration ? formatDuration(finalShow.duration) : null,
      tags: extractTags(finalShow.title, finalShow.description),
      published_date_formatted: new Date(finalShow.published_date).toLocaleDateString('en-US', {
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

/**
 * Fetch image URL from Storyblok story
 */
async function fetchImageFromStoryblok(storyblokId: string): Promise<string | null> {
  try {
    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN
    if (!storyblokToken) {
      console.error('Storyblok access token not configured')
      return null
    }

    const response = await fetch(
      `https://api.storyblok.com/v2/cdn/stories/${storyblokId}?token=${storyblokToken}&version=published`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Rhythm Lab Radio App'
        }
      }
    )

    if (!response.ok) {
      console.error(`Storyblok API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const story = data.story

    if (story?.content?.mixcloud_picture) {
      // Handle both string URLs and Storyblok Asset objects
      const pictureField = story.content.mixcloud_picture

      if (typeof pictureField === 'string') {
        return pictureField
      } else if (typeof pictureField === 'object' && pictureField.filename) {
        return pictureField.filename
      }
    }

    return null

  } catch (error) {
    console.error('Error fetching from Storyblok:', error)
    return null
  }
}