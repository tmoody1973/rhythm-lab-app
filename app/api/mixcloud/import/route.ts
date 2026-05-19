import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createServerClient } from '@supabase/ssr'
import { upsertEpisode, type TracklistItem } from '@/lib/sanity/episodeHelpers'
import { parsePlaylistText, tracksToDbFormat } from '@/lib/playlist-parser'

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
  sanity_episode_id?: string
  sanity_slug?: string
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
      .select('id, title')
      .or(`slug.eq.${slug},mixcloud_url.eq.${body.mixcloud_url}`)
      .single()

    if (existingShow) {
      // Show already in Supabase — still try to create the Sanity episode in case it wasn't made
      try {
        const mixcloudKey = body.mixcloud_url.startsWith('https://www.mixcloud.com')
          ? body.mixcloud_url.replace('https://www.mixcloud.com', '')
          : body.mixcloud_url
        const { upsertEpisode } = await import('@/lib/sanity/episodeHelpers')
        const episodeResult = await upsertEpisode({
          mixcloudKey,
          title: body.title,
          date: body.date,
          duration: body.duration,
          coverImageUrl: body.cover_image,
          tracklist: [],
        })
        return NextResponse.json({
          success: true,
          message: `Show already existed in database. Sanity episode ${episodeResult.created ? 'created' : 'updated'}: /episodes/${episodeResult.slug}`,
          show_id: existingShow.id,
          sanity_episode_id: episodeResult.sanityId,
          sanity_slug: episodeResult.slug,
        }, { status: 200 })
      } catch {
        return NextResponse.json({
          success: false,
          message: `Show already exists: "${existingShow.title}". Use the edit feature to update it.`,
          show_id: existingShow.id,
        }, { status: 409 })
      }
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

    // 3. Create/update Sanity episode draft (replaces Storyblok)
    let sanityEpisodeId: string | undefined
    let sanitySlug: string | undefined
    let sanityWarning: string | undefined

    try {
      const tracklist: TracklistItem[] = parseResult.tracks
        .filter((t: any) => t.artist && t.title)
        .map((t: any) => ({
          startTime: t.start_time ?? 0,
          artistName: String(t.artist ?? ''),
          trackName: String(t.title ?? ''),
        }))

      // Extract mixcloudKey from URL (remove https://www.mixcloud.com prefix)
      const mixcloudKey = body.mixcloud_url.startsWith('https://www.mixcloud.com')
        ? body.mixcloud_url.replace('https://www.mixcloud.com', '')
        : body.mixcloud_url

      const episodeResult = await upsertEpisode({
        mixcloudKey,
        title: body.title,
        date: body.date,
        duration: body.duration,
        coverImageUrl: body.cover_image,
        tracklist,
      })

      sanityEpisodeId = episodeResult.sanityId
      sanitySlug = episodeResult.slug

      // Update Supabase show record with sanity episode slug (non-blocking)
      supabase
        .from('shows')
        .update({ slug: sanitySlug, updated_at: new Date().toISOString() })
        .eq('id', showId)
        .then(({ error }) => {
          if (error) console.warn('Failed to update show slug in Supabase:', error.message)
        })

      // Fire async AI description generation (fire-and-forget)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/episodes/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mixcloudKey, title: body.title, tracklist, tags: [] }),
      }).catch(err => console.warn('AI description generation failed:', err))

    } catch (episodeError) {
      console.error('Sanity episode creation failed:', episodeError)
      sanityWarning = `Episode draft creation failed: ${episodeError instanceof Error ? episodeError.message : 'Unknown error'}`
    }

    return NextResponse.json({
      success: true,
      show_id: showId,
      sanity_episode_id: sanityEpisodeId,
      sanity_slug: sanitySlug,
      tracks_imported: tracksImported,
      errors: parseResult.errors,
      warnings: sanityWarning ? [sanityWarning, ...parseResult.warnings] : parseResult.warnings,
      message: hasPlaylist
        ? `Successfully imported show "${body.title}" with ${tracksImported} tracks${sanitySlug ? `. Episode at /episodes/${sanitySlug}` : ''}`
        : `Successfully imported show "${body.title}" (no playlist data)${sanitySlug ? `. Episode at /episodes/${sanitySlug}` : ''}`,
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