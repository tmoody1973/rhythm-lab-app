import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createServerClient } from '@supabase/ssr'
import { parsePlaylistText, tracksToDbFormat, tracksToStoryblokFormat } from '@/lib/playlist-parser'

interface ImportShowRequest {
  // Show metadata
  title: string
  description?: string
  date: string // ISO date string
  mixcloud_url: string
  embed_code?: string
  cover_image?: string
  duration?: number

  // Playlist data
  playlist_text: string

  // Optional overrides
  slug?: string
  status?: 'draft' | 'published'
}

interface ImportResponse {
  success: boolean
  show_id?: string
  storyblok_id?: string
  tracks_imported?: number
  errors?: string[]
  warnings?: string[]
  message?: string
}

/**
 * POST /api/mixcloud/import
 * Import a Mixcloud show with playlist data to Supabase and Storyblok
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: ImportShowRequest = await request.json()

    // Validate required fields
    const required = ['title', 'date', 'mixcloud_url']
    const missing = required.filter(field => !body[field])

    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      }, { status: 400 })
    }

    // Parse playlist text (optional for archive imports)
    let parseResult = { tracks: [], errors: [], warnings: [] }
    let hasPlaylist = false

    if (body.playlist_text && body.playlist_text.trim()) {
      parseResult = parsePlaylistText(body.playlist_text)
      hasPlaylist = true

      if (parseResult.tracks.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No tracks found in playlist text',
          errors: parseResult.errors
        }, { status: 400 })
      }
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

    // Generate slug if not provided
    const slug = body.slug || generateSlug(body.title)

    // 1. Insert show into Supabase
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .insert({
        title: body.title,
        description: body.description || '',
        published_date: body.date,
        slug: slug,
        mixcloud_url: body.mixcloud_url,
        mixcloud_embed: body.embed_code || '',
        mixcloud_picture: body.cover_image || '',
      })
      .select()
      .single()

    if (showError) {
      console.error('Error inserting show:', showError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create show record',
        errors: [showError.message]
      }, { status: 500 })
    }

    const showId = showData.id

    // 2. Insert tracks into Supabase (only if playlist provided)
    let tracksImported = 0
    if (hasPlaylist && parseResult.tracks.length > 0) {
      const dbTracks = tracksToDbFormat(parseResult.tracks).map(track => ({
        ...track,
        show_id: showId
      }))

      const { error: tracksError } = await supabase
        .from('mixcloud_tracks')
        .insert(dbTracks)

      if (tracksError) {
        console.error('Error inserting tracks:', tracksError)
        // Try to clean up the show record
        await supabase.from('shows').delete().eq('id', showId)

        return NextResponse.json({
          success: false,
          message: 'Failed to import tracks',
          errors: [tracksError.message]
        }, { status: 500 })
      }

      tracksImported = dbTracks.length
    }

    // 3. Create Storyblok entry
    let storyblokId: string | undefined
    try {
      const storyblokResponse = await createStoryblokShow({
        title: body.title,
        description: body.description || '',
        published_date: body.date,
        slug: slug,
        mixcloud_url: body.mixcloud_url,
        mixcloud_embed: body.embed_code || '',
        mixcloud_picture: body.cover_image || '',
        tracks: hasPlaylist ? tracksToStoryblokFormat(parseResult.tracks) : [],
        show_id: showId
      })

      storyblokId = storyblokResponse.story.id

      // Update show with Storyblok ID
      await supabase
        .from('shows')
        .update({ storyblok_id: storyblokId })
        .eq('id', showId)

    } catch (storyblokError) {
      console.error('Storyblok creation failed:', storyblokError)
      // Don't fail the entire import, just log the warning
    }

    return NextResponse.json({
      success: true,
      show_id: showId,
      storyblok_id: storyblokId,
      tracks_imported: tracksImported,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
      message: hasPlaylist
        ? `Successfully imported show "${body.title}" with ${tracksImported} tracks`
        : `Successfully imported show "${body.title}" (no playlist data)`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during import',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 })
  }
})

/**
 * Create Storyblok story for the show
 */
async function createStoryblokShow(showData: any) {
  const storyblokToken = process.env.STORYBLOK_MANAGEMENT_TOKEN

  if (!storyblokToken) {
    throw new Error('STORYBLOK_MANAGEMENT_TOKEN not configured')
  }

  const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${process.env.STORYBLOK_SPACE_ID}/stories`, {
    method: 'POST',
    headers: {
      'Authorization': storyblokToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      story: {
        name: showData.title,
        slug: showData.slug,
        content: {
          component: 'mixcloud_show',
          title: showData.title,
          description: showData.description,
          date: showData.date,
          mixcloud_url: showData.mixcloud_url,
          embed_code: showData.embed_code,
          cover_image: showData.cover_image,
          playlist: showData.tracks,
          show_id: showData.show_id
        },
        published: true
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Storyblok API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export const POST = handler