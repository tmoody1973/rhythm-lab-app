import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createServerClient } from '@supabase/ssr'

interface ShowEnhancementStatus {
  show_id: string
  title: string
  total_tracks: number
  tracks_with_youtube: number
  tracks_with_discogs: number
  enhancement_percentage: number
  last_enhanced?: string
  needs_enhancement: boolean
}

/**
 * GET /api/mixcloud/shows-enhancement-status
 * Get all shows with their track enhancement status
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
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

    console.log('[Shows Enhancement Status] Fetching shows and track data')

    // Get all shows with their track counts and enhancement status
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        title,
        updated_at,
        created_at
      `)
      .order('updated_at', { ascending: false })

    if (showsError) {
      console.error('[Shows Enhancement Status] Failed to fetch shows:', showsError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch shows',
        error: showsError.message
      }, { status: 500 })
    }

    if (!showsData || showsData.length === 0) {
      console.log('[Shows Enhancement Status] No shows found')
      return NextResponse.json({
        success: true,
        shows: [],
        message: 'No shows found'
      })
    }

    console.log(`[Shows Enhancement Status] Found ${showsData.length} shows, getting track data`)

    // Get track enhancement status for all shows
    const showIds = showsData.map(show => show.id)

    const { data: tracksData, error: tracksError } = await supabase
      .from('mixcloud_tracks')
      .select(`
        show_id,
        youtube_url,
        discogs_url
      `)
      .in('show_id', showIds)

    if (tracksError) {
      console.error('[Shows Enhancement Status] Failed to fetch tracks:', tracksError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch track data',
        error: tracksError.message
      }, { status: 500 })
    }

    console.log(`[Shows Enhancement Status] Found ${tracksData?.length || 0} tracks total`)

    // Calculate enhancement status for each show
    const showsWithStatus: ShowEnhancementStatus[] = showsData.map(show => {
      const showTracks = tracksData?.filter(track => track.show_id === show.id) || []
      const totalTracks = showTracks.length
      const tracksWithYoutube = showTracks.filter(track => track.youtube_url).length
      const tracksWithDiscogs = showTracks.filter(track => track.discogs_url).length

      // Calculate overall enhancement percentage
      // Each track can have YouTube (50%) + Discogs (50%) = 100% enhanced
      const possibleEnhancements = totalTracks * 2 // YouTube + Discogs per track
      const actualEnhancements = tracksWithYoutube + tracksWithDiscogs
      const enhancementPercentage = possibleEnhancements > 0
        ? Math.round((actualEnhancements / possibleEnhancements) * 100)
        : 0

      // Consider a show as "needing enhancement" if less than 50% enhanced and has tracks
      const needsEnhancement = totalTracks > 0 && enhancementPercentage < 50

      return {
        show_id: show.id,
        title: show.title,
        total_tracks: totalTracks,
        tracks_with_youtube: tracksWithYoutube,
        tracks_with_discogs: tracksWithDiscogs,
        enhancement_percentage: enhancementPercentage,
        last_enhanced: show.updated_at,
        needs_enhancement: needsEnhancement
      }
    })

    const summary = {
      total_shows: showsWithStatus.length,
      shows_needing_enhancement: showsWithStatus.filter(show => show.needs_enhancement).length,
      fully_enhanced_shows: showsWithStatus.filter(show => show.enhancement_percentage >= 90).length,
      total_tracks: showsWithStatus.reduce((sum, show) => sum + show.total_tracks, 0),
      enhanced_tracks: showsWithStatus.reduce((sum, show) => sum + show.tracks_with_youtube + show.tracks_with_discogs, 0)
    }

    console.log('[Shows Enhancement Status] Summary:', summary)

    return NextResponse.json({
      success: true,
      shows: showsWithStatus,
      summary
    })

  } catch (error) {
    console.error('[Shows Enhancement Status] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

export const GET = handler