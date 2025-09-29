import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createServerClient } from '@supabase/ssr'
import { createMixcloudShowStory } from '@/lib/storyblok-management'
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
const handler = withAdminAuth(async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body: ImportShowRequest = await request.json()

    // Validate required fields using explicit property access - TypeScript safe approach
    // Branch: feature/mixcloud-deploy-fix
    const missingFields: string[] = []
    if (!body.title) missingFields.push('title')
    if (!body.date) missingFields.push('date')
    if (!body.mixcloud_url) missingFields.push('mixcloud_url')

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Parse playlist text (optional for archive imports)
    let parseResult: { tracks: any[], errors: string[], warnings: string[] } = { tracks: [], errors: [], warnings: [] }
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

    // Create Supabase client with service role for admin operations (bypasses RLS)
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Generate slug if not provided
    const slug = body.slug || generateSlug(body.title)

    // Check if show already exists (by slug or mixcloud_url)
    const { data: existingShow } = await supabase
      .from('shows')
      .select('id, title, storyblok_id')
      .or(`slug.eq.${slug},mixcloud_url.eq.${body.mixcloud_url}`)
      .single()

    if (existingShow) {
      return NextResponse.json({
        success: false,
        message: `Show already exists: "${existingShow.title}". Use the edit feature to update it.`,
        show_id: existingShow.id,
        storyblok_id: existingShow.storyblok_id
      }, { status: 409 })
    }

    // 1. Insert show into Supabase
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .insert({
        title: body.title,
        description: body.description || '',
        published_date: body.date, // Use actual Supabase column name
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

    // 3. Create Storyblok entry using the same method as upload show
    let storyblokId: string | undefined
    let storyblokWarning: string | undefined

    try {
      const publishedDate = new Date(body.date)
      const storyblokTracklist = hasPlaylist ? tracksToStoryblokFormat(parseResult.tracks) : []

      console.log('📝 Creating Storyblok story for:', {
        title: body.title,
        showId: showId,
        tracklistCount: storyblokTracklist.length,
        hasPlaylist
      })

      const storyblokResponse = await createMixcloudShowStory({
        title: body.title,
        description: body.description || '',
        mixcloudUrl: body.mixcloud_url,
        publishedDate,
        tracklist: storyblokTracklist,
        coverImageFile: undefined, // Archive imports don't have file uploads
        showId: showId
      })

      storyblokId = storyblokResponse.story.id.toString()
      console.log('✅ Storyblok story created successfully:', {
        storyblokId,
        storyName: storyblokResponse.story.name,
        storySlug: storyblokResponse.story.slug
      })

      // Update show with Storyblok ID and slug
      const { error: updateError } = await supabase
        .from('shows')
        .update({
          storyblok_id: storyblokId,
          slug: storyblokResponse.story.slug, // Save Storyblok's slug with timestamp
          updated_at: new Date().toISOString()
        })
        .eq('id', showId)

      if (updateError) {
        console.error('Failed to update show with storyblok_id:', updateError)
        storyblokWarning = `Storyblok story created but failed to link: ${updateError.message}`
      }

    } catch (storyblokError) {
      console.error('❌ Storyblok creation failed:', {
        error: storyblokError,
        message: storyblokError instanceof Error ? storyblokError.message : 'Unknown error',
        stack: storyblokError instanceof Error ? storyblokError.stack : undefined
      })

      storyblokWarning = `Storyblok creation failed: ${storyblokError instanceof Error ? storyblokError.message : 'Unknown error'}`
      parseResult.warnings.push(storyblokWarning)
      // Don't fail the entire import, just log the warning
    }

    return NextResponse.json({
      success: true,
      show_id: showId,
      storyblok_id: storyblokId,
      tracks_imported: tracksImported,
      errors: parseResult.errors,
      warnings: storyblokWarning ? [storyblokWarning, ...parseResult.warnings] : parseResult.warnings,
      message: hasPlaylist
        ? `Successfully imported show "${body.title}" with ${tracksImported} tracks${storyblokId ? '' : ' (Storyblok sync failed - see warnings)'}`
        : `Successfully imported show "${body.title}" (no playlist data)${storyblokId ? '' : ' (Storyblok sync failed - see warnings)'}`
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