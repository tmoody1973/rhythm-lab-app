import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createServerClient } from '@supabase/ssr'
import { parsePlaylistText, tracksToDbFormat, tracksToStoryblokFormat } from '@/lib/playlist-parser'

interface SyncShowRequest {
  show_id: string // UUID of the show to update

  // Optional fields to update
  title?: string
  description?: string
  date?: string
  mixcloud_url?: string
  embed_code?: string
  cover_image?: string
  duration?: number
  status?: 'draft' | 'published'

  // If provided, will replace existing playlist
  playlist_text?: string

  // Control what to sync
  update_storyblok?: boolean
  update_tracks?: boolean
}

interface SyncResponse {
  success: boolean
  show_id: string
  storyblok_id?: string
  tracks_updated?: number
  updated_fields?: string[]
  errors?: string[]
  warnings?: string[]
  message?: string
}

/**
 * PUT /api/mixcloud/sync
 * Update existing show and sync with Storyblok
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: SyncShowRequest = await request.json()

    if (!body.show_id) {
      return NextResponse.json({
        success: false,
        message: 'show_id is required'
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

    // 1. Verify show exists
    const { data: existingShow, error: showFetchError } = await supabase
      .from('shows')
      .select('*')
      .eq('id', body.show_id)
      .single()

    if (showFetchError || !existingShow) {
      return NextResponse.json({
        success: false,
        message: 'Show not found'
      }, { status: 404 })
    }

    const updatedFields: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    // 2. Update show metadata if provided
    const showUpdates: any = {}
    const metadataFields = ['title', 'description', 'date', 'mixcloud_url', 'embed_code', 'cover_image', 'duration', 'status']

    metadataFields.forEach(field => {
      if (body[field as keyof SyncShowRequest] !== undefined) {
        showUpdates[field] = body[field as keyof SyncShowRequest]
        updatedFields.push(field)
      }
    })

    if (Object.keys(showUpdates).length > 0) {
      showUpdates.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('shows')
        .update(showUpdates)
        .eq('id', body.show_id)

      if (updateError) {
        errors.push(`Failed to update show: ${updateError.message}`)
      }
    }

    // 3. Update playlist if provided
    let tracksUpdated = 0
    let parseResult: any = null

    if (body.playlist_text && body.update_tracks !== false) {
      parseResult = parsePlaylistText(body.playlist_text)

      if (parseResult.tracks.length > 0) {
        // Delete existing tracks
        const { error: deleteError } = await supabase
          .from('mixcloud_tracks')
          .delete()
          .eq('show_id', body.show_id)

        if (deleteError) {
          errors.push(`Failed to delete existing tracks: ${deleteError.message}`)
        } else {
          // Insert new tracks
          const dbTracks = tracksToDbFormat(parseResult.tracks).map(track => ({
            ...track,
            show_id: body.show_id
          }))

          const { error: insertError } = await supabase
            .from('mixcloud_tracks')
            .insert(dbTracks)

          if (insertError) {
            errors.push(`Failed to insert new tracks: ${insertError.message}`)
          } else {
            tracksUpdated = parseResult.tracks.length
            updatedFields.push('playlist')
          }
        }
      }

      errors.push(...parseResult.errors)
      warnings.push(...parseResult.warnings)
    }

    // 4. Update Storyblok if requested and story exists
    if (body.update_storyblok !== false && existingShow.storyblok_id) {
      try {
        // Get updated show data
        const { data: updatedShow } = await supabase
          .from('shows')
          .select('*')
          .eq('id', body.show_id)
          .single()

        const storyblokContent: any = {
          component: 'mixcloud_show',
          title: updatedShow?.title || existingShow.title,
          description: updatedShow?.description || existingShow.description,
          published_date: formatDateForStoryblok(updatedShow?.published_date || existingShow.published_date), // Format for Storyblok
          mixcloud_url: updatedShow?.mixcloud_url || existingShow.mixcloud_url,
          mixcloud_embed: updatedShow?.mixcloud_embed || existingShow.mixcloud_embed,
          mixcloud_picture: updatedShow?.mixcloud_picture || existingShow.mixcloud_picture,
          show_id: body.show_id
        }

        // Add updated playlist if available
        if (parseResult && parseResult.tracks.length > 0) {
          const formattedTracks = tracksToStoryblokFormat(parseResult.tracks)
          console.log('Formatted tracks for Storyblok:', JSON.stringify(formattedTracks.slice(0, 2), null, 2)) // Log first 2 tracks

          // Storyblok now expects Blocks array for the tracklist field
          storyblokContent.tracklist = formattedTracks
        }

        await updateStoryblokShow(existingShow.storyblok_id, {
          name: storyblokContent.title,
          content: storyblokContent
        })

      } catch (storyblokError) {
        warnings.push(`Storyblok update failed: ${storyblokError instanceof Error ? storyblokError.message : 'Unknown error'}`)
      }
    }

    // 5. Prepare response
    const response: SyncResponse = {
      success: errors.length === 0,
      show_id: body.show_id,
      storyblok_id: existingShow.storyblok_id,
      updated_fields: updatedFields,
      errors,
      warnings,
      message: `Show sync completed. ${updatedFields.length} fields updated.`
    }

    if (tracksUpdated > 0) {
      response.tracks_updated = tracksUpdated
    }

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200 // 207 Multi-Status for partial success
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during sync',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 })
  }
})

/**
 * Format date for Storyblok Date/Time field
 * Converts ISO string to YYYY-MM-DD HH:mm format
 */
function formatDateForStoryblok(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.warn('Invalid date format for Storyblok:', isoDate)
    return isoDate // Fallback to original
  }
}

/**
 * Update Storyblok story
 */
async function updateStoryblokShow(storyId: string, updateData: any) {
  const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN

  if (!storyblokToken) {
    throw new Error('STORYBLOK_MANAGEMENT_TOKEN not configured')
  }

  const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${storyId}`, {
    method: 'PUT',
    headers: {
      'Authorization': storyblokToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      story: updateData
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Storyblok API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * GET /api/mixcloud/sync?show_id={id}
 * Get show sync status and information
 */
const getHandler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const url = new URL(request.url)
    const showId = url.searchParams.get('show_id')

    if (!showId) {
      return NextResponse.json({
        success: false,
        message: 'show_id parameter is required'
      }, { status: 400 })
    }

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

    // Get show with track count
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        *,
        mixcloud_tracks(count)
      `)
      .eq('id', showId)
      .single()

    if (showError || !show) {
      return NextResponse.json({
        success: false,
        message: 'Show not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      show: {
        ...show,
        track_count: show.mixcloud_tracks?.[0]?.count || 0,
        has_storyblok: !!show.storyblok_id,
        sync_status: {
          database: 'synced',
          storyblok: show.storyblok_id ? 'synced' : 'missing'
        }
      }
    })

  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
})

export const PUT = handler
export const GET = getHandler