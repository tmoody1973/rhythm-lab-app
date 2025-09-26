import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createServerClient } from '@supabase/ssr'
import { enhanceTracksBatch, checkEnhancementQuotas } from '@/lib/external-apis/track-enhancement'
import type { MixcloudTrack } from '@/lib/database/mixcloud-types'

interface EnhanceTracksRequest {
  show_id?: string // If provided, enhance all tracks in this show
  track_ids?: string[] // If provided, enhance only these specific tracks
  options?: {
    enable_youtube?: boolean
    enable_discogs?: boolean
    skip_existing?: boolean
    force_refresh?: boolean
  }
}

interface EnhanceTracksResponse {
  success: boolean
  message: string
  results?: {
    total_tracks: number
    enhanced_youtube: number
    enhanced_discogs: number
    skipped_youtube: number
    skipped_discogs: number
    failed_youtube: number
    failed_discogs: number
    quota_usage: {
      youtube: {
        used: number
        remaining: number
        percentage_used: number
      }
      discogs: {
        requests_this_minute: number
        max_per_minute: number
      }
    }
  }
  errors?: string[]
  warnings?: string[]
}

/**
 * POST /api/mixcloud/enhance-tracks
 * Enhance tracks with YouTube and Discogs data
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: EnhanceTracksRequest = await request.json()
    const { show_id, track_ids, options = {} } = body

    // Validate request
    if (!show_id && !track_ids) {
      return NextResponse.json({
        success: false,
        message: 'Either show_id or track_ids must be provided'
      }, { status: 400 })
    }

    if (track_ids && track_ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'track_ids array cannot be empty'
      }, { status: 400 })
    }

    // Set up Supabase client with service role for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Use service role key for admin operations
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    // Check API quotas before starting
    const quotas = await checkEnhancementQuotas()

    if (options.enable_youtube !== false && !quotas.youtube.available) {
      return NextResponse.json({
        success: false,
        message: 'YouTube API quota exceeded. Please try again later.',
        quota_status: quotas
      }, { status: 429 })
    }

    if (options.enable_discogs !== false && !quotas.discogs.available) {
      return NextResponse.json({
        success: false,
        message: 'Discogs API rate limit reached. Please wait a moment.',
        quota_status: quotas
      }, { status: 429 })
    }

    console.log(`[Track Enhancement] Starting enhancement request for user: ${user.id}`)

    // Fetch tracks to enhance
    let tracksQuery = supabase.from('mixcloud_tracks').select('*')

    if (show_id) {
      tracksQuery = tracksQuery.eq('show_id', show_id)
      console.log(`[Track Enhancement] Enhancing all tracks for show: ${show_id}`)
    } else if (track_ids) {
      tracksQuery = tracksQuery.in('id', track_ids)
      console.log(`[Track Enhancement] Enhancing ${track_ids.length} specific tracks`)
    }

    const { data: tracks, error: fetchError } = await tracksQuery.order('position')

    if (fetchError) {
      console.error('[Track Enhancement] Failed to fetch tracks:', fetchError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch tracks from database',
        errors: [fetchError.message]
      }, { status: 500 })
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No tracks found to enhance'
      }, { status: 404 })
    }

    console.log(`[Track Enhancement] Found ${tracks.length} tracks to process`)

    // Transform tracks for enhancement service
    const trackData = tracks.map((track: MixcloudTrack) => ({
      id: track.id,
      artist: track.artist,
      trackName: track.track,
      youtubeUrl: track.youtube_url || undefined,
      discogsUrl: track.discogs_url || undefined
    }))

    // Enhance tracks using external APIs
    const enhancementResult = await enhanceTracksBatch(trackData, {
      enableYouTube: options.enable_youtube !== false,
      enableDiscogs: options.enable_discogs !== false,
      skipExisting: options.skip_existing !== false,
      onProgress: (completed, total, currentTrack, status) => {
        console.log(`[Track Enhancement] Progress: ${completed}/${total} - ${status} - ${currentTrack}`)
      }
    })

    // Debug: Check what we got back from enhancement
    console.log(`[Track Enhancement] Enhancement result summary:`, enhancementResult.summary)
    console.log(`[Track Enhancement] Number of enhanced tracks returned:`, enhancementResult.tracks.length)

    // Debug: Check first track to see its structure
    if (enhancementResult.tracks.length > 0) {
      const firstTrack = enhancementResult.tracks[0]
      console.log(`[Track Enhancement] First track structure:`, {
        id: firstTrack.id,
        artist: firstTrack.artist,
        hasDiscogsUrl: !!firstTrack.discogsUrl,
        discogsUrl: firstTrack.discogsUrl,
        discogsStatus: firstTrack.enhancementStatus.discogs
      })
    }

    // Update database with enhanced data - do it sequentially to avoid issues
    let updatedCount = 0
    let failedUpdates = []

    for (const track of enhancementResult.tracks) {
      const updateData: Partial<MixcloudTrack> = {}
      let hasUpdates = false

      // Debug logging for database updates
      console.log(`[Track Enhancement] Checking track for DB update:`, {
        id: track.id,
        artist: track.artist,
        hasYoutubeUrl: !!track.youtubeUrl,
        youtubeStatus: track.enhancementStatus.youtube,
        hasDiscogsUrl: !!track.discogsUrl,
        discogsStatus: track.enhancementStatus.discogs
      })

      // Only update fields that were successfully enhanced or if force_refresh is true
      if (track.youtubeUrl && (track.enhancementStatus.youtube === 'success' || options.force_refresh)) {
        updateData.youtube_url = track.youtubeUrl
        hasUpdates = true
        console.log(`[Track Enhancement] Will update YouTube URL for track ${track.id}: ${track.youtubeUrl}`)
      }

      if (track.discogsUrl && (track.enhancementStatus.discogs === 'success' || options.force_refresh)) {
        updateData.discogs_url = track.discogsUrl
        hasUpdates = true
        console.log(`[Track Enhancement] Will update Discogs URL for track ${track.id}: ${track.discogsUrl}`)
      }

      if (hasUpdates && track.id) {
        try {
          console.log(`[Track Enhancement] Updating track ${track.id} with:`, updateData)
          console.log(`[Track Enhancement] Executing database update for track ${track.id}...`)

          const { data: updateResult, error } = await supabase
            .from('mixcloud_tracks')
            .update(updateData)
            .eq('id', track.id)
            .select()

          if (error) {
            console.error(`[Track Enhancement] Failed to update track ${track.id}:`, error)
            failedUpdates.push({ trackId: track.id, error: error.message })
          } else {
            console.log(`[Track Enhancement] Successfully updated track ${track.id} in database`, updateResult)
            updatedCount++
          }
        } catch (err) {
          console.error(`[Track Enhancement] Exception updating track ${track.id}:`, err)
          failedUpdates.push({ trackId: track.id, error: err instanceof Error ? err.message : 'Unknown error' })
        }
      } else if (!hasUpdates) {
        console.log(`[Track Enhancement] No updates needed for track ${track.id}`)
      }
    }

    console.log(`[Track Enhancement] Database update complete: ${updatedCount} successful, ${failedUpdates.length} failed`)

    if (failedUpdates.length > 0) {
      console.error('[Track Enhancement] Failed updates:', failedUpdates)
    }

    // Update Storyblok if show has a storyblok_id
    if (show_id) {
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select('storyblok_id, title')
        .eq('id', show_id)
        .single()

      if (!showError && showData?.storyblok_id) {
        console.log(`[Track Enhancement] Updating Storyblok story ${showData.storyblok_id}`)

        try {
          // First, get the existing story to preserve all other fields
          const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN
          const spaceId = process.env.STORYBLOK_SPACE_ID

          const existingStoryResponse = await fetch(
            `https://mapi.storyblok.com/v1/spaces/${spaceId}/stories/${showData.storyblok_id}`,
            {
              headers: {
                'Authorization': storyblokToken!,
                'Content-Type': 'application/json'
              }
            }
          )

          if (!existingStoryResponse.ok) {
            console.error('[Track Enhancement] Failed to fetch existing Storyblok story')
            return
          }

          const existingStory = await existingStoryResponse.json()

          // Fetch all tracks for this show with their enhanced URLs
          const { data: allTracks } = await supabase
            .from('mixcloud_tracks')
            .select('*')
            .eq('show_id', show_id)
            .order('position')

          if (allTracks && existingStory?.story?.content) {
            // Convert tracks to Storyblok format with enhanced URLs
            const storyblokTracks = allTracks.map(track => ({
              component: 'track',
              _uid: `track_${track.position}`,
              position: track.position,
              hour: track.hour || 1,
              artist: track.artist,
              track: track.track,
              spotify_url: track.spotify_url || '',
              youtube_url: track.youtube_url || '',
              discogs_url: track.discogs_url || ''
            }))

            // Update the story content, preserving all existing fields
            const updatedContent = {
              ...existingStory.story.content,
              tracklisting: storyblokTracks  // Note: using 'tracklisting' as the field name
            }

            // Update Storyblok story
            const storyblokUpdateResponse = await fetch(
              `https://mapi.storyblok.com/v1/spaces/${spaceId}/stories/${showData.storyblok_id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': storyblokToken!,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  story: {
                    content: updatedContent
                  }
                })
              }
            )

            if (!storyblokUpdateResponse.ok) {
              const error = await storyblokUpdateResponse.text()
              console.error('[Track Enhancement] Storyblok update failed:', error)
            } else {
              console.log('[Track Enhancement] Successfully updated Storyblok with enhanced tracks')
            }
          }
        } catch (storyblokError) {
          console.error('[Track Enhancement] Storyblok sync error:', storyblokError)
          // Don't fail the request, just log the error
        }
      }
    }

    // Prepare response
    const response: EnhanceTracksResponse = {
      success: true,
      message: `Successfully enhanced ${tracks.length} tracks`,
      results: {
        total_tracks: enhancementResult.summary.total,
        enhanced_youtube: enhancementResult.summary.youtubeFound,
        enhanced_discogs: enhancementResult.summary.discogsFound,
        skipped_youtube: enhancementResult.summary.youtubeSkipped,
        skipped_discogs: enhancementResult.summary.discogsSkipped,
        failed_youtube: enhancementResult.summary.youtubeFailed,
        failed_discogs: enhancementResult.summary.discogsFailed,
        quota_usage: {
          youtube: {
            used: enhancementResult.quotaUsage.youtube.dailyQuotaUsed,
            remaining: enhancementResult.quotaUsage.youtube.estimatedRequestsRemaining,
            percentage_used: enhancementResult.quotaUsage.youtube.percentageUsed
          },
          discogs: {
            requests_this_minute: enhancementResult.quotaUsage.discogs.requestCount,
            max_per_minute: enhancementResult.quotaUsage.discogs.maxRequestsPerMinute
          }
        }
      },
      warnings: []
    }

    // Add warnings for quota usage
    if (enhancementResult.quotaUsage.youtube.percentageUsed > 80) {
      response.warnings?.push(`YouTube API quota at ${enhancementResult.quotaUsage.youtube.percentageUsed.toFixed(1)}% - consider requesting quota increase`)
    }

    if (enhancementResult.quotaUsage.discogs.requestCount > enhancementResult.quotaUsage.discogs.maxRequestsPerMinute * 0.8) {
      response.warnings?.push('Discogs rate limit approaching - future requests may be delayed')
    }

    console.log(`[Track Enhancement] Completed successfully:`, response.results)

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Track Enhancement] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during track enhancement',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 })
  }
})

export const POST = handler