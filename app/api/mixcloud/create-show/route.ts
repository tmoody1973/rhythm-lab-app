import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { upsertEpisode, type TracklistItem } from '@/lib/sanity/episodeHelpers'
import { parsePlaylistText, tracksToDbFormat } from '@/lib/playlist-parser'

interface CreateShowRequest {
  title: string
  description?: string
  mixcloud_url: string
  published_date?: string // ISO date string
  playlist_text?: string
  cover_image?: File
}

interface CreateShowResponse {
  success: boolean
  show_id?: string
  sanity_episode_id?: string
  sanity_slug?: string
  tracks_count?: number
  message?: string
  errors?: string[]
  warnings?: string[]
}

/**
 * POST /api/mixcloud/create-show
 * Create show record in database and sync to Storyblok after successful Mixcloud upload
 */
const handler = withAdminAuth(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Parse FormData (for file uploads) or JSON
    let body: CreateShowRequest
    const contentType = request.headers.get('content-type')

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || undefined,
        mixcloud_url: formData.get('mixcloud_url') as string,
        published_date: formData.get('published_date') as string || undefined,
        playlist_text: formData.get('playlist_text') as string || undefined,
        cover_image: formData.get('cover_image') as File || undefined
      }
    } else {
      body = await request.json()
    }

    // Validate required fields
    if (!body.title || !body.mixcloud_url) {
      return NextResponse.json({
        success: false,
        message: 'Title and Mixcloud URL are required'
      }, { status: 400 })
    }

    // Validate Mixcloud URL format
    if (!body.mixcloud_url.includes('mixcloud.com')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Mixcloud URL format'
      }, { status: 400 })
    }

    // Create Supabase client with service role for admin operations (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
      return NextResponse.json({
        success: false,
        message: 'Server configuration error: Service role key not found',
        errors: ['SUPABASE_SERVICE_ROLE_KEY environment variable is not configured']
      }, { status: 500 })
    }

    console.log('🔑 Using service role key (first 20 chars):', serviceRoleKey.substring(0, 20))

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          persistSession: false
        }
      }
    )

    const errors: string[] = []
    const warnings: string[] = []

    // 1. Parse playlist if provided
    let parseResult: any = null
    if (body.playlist_text) {
      parseResult = parsePlaylistText(body.playlist_text)
      errors.push(...parseResult.errors)
      warnings.push(...parseResult.warnings)
    }

    // 2. Create show record in database
    const publishedDate = body.published_date ? new Date(body.published_date) : new Date()

    // Generate a slug from the title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

    const showData = {
      title: body.title,
      slug: slug, // Add slug field
      description: body.description || '',
      mixcloud_url: body.mixcloud_url,
      mixcloud_embed: generateMixcloudEmbed(body.mixcloud_url),
      mixcloud_picture: '', // Will be updated after Storyblok upload
      published_date: publishedDate.toISOString(),
      status: 'published' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: showRecord, error: showError } = await supabase
      .from('shows')
      .insert(showData)
      .select()
      .single()

    if (showError || !showRecord) {
      console.error('Database insert error:', showError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create show record',
        errors: [showError?.message || 'Unknown database error']
      }, { status: 500 })
    }

    const showId = showRecord.id

    // 3. Insert tracks if playlist was provided
    let tracksCount = 0

    if (parseResult && parseResult.tracks.length > 0) {
      // Save tracks to database
      const dbTracks = tracksToDbFormat(parseResult.tracks).map(track => ({
        ...track,
        show_id: showId
      }))

      const { error: tracksError } = await supabase
        .from('mixcloud_tracks')
        .insert(dbTracks)

      if (tracksError) {
        errors.push(`Failed to save tracks: ${tracksError.message}`)
      } else {
        tracksCount = parseResult.tracks.length
      }
    }

    // 4. Create/update Sanity episode draft (replaces Storyblok)
    let sanityEpisodeId: string | undefined
    let sanitySlug: string | undefined

    try {
      const tracklist: TracklistItem[] = (parseResult?.tracks ?? [])
        .filter((t: any) => t.artist && t.title)
        .map((t: any) => ({
          startTime: t.start_time ?? 0,
          artistName: String(t.artist ?? ''),
          trackName: String(t.title ?? ''),
        }))

      const mixcloudKey = body.mixcloud_url.startsWith('https://www.mixcloud.com')
        ? body.mixcloud_url.replace('https://www.mixcloud.com', '')
        : body.mixcloud_url

      const episodeResult = await upsertEpisode({
        mixcloudKey,
        title: body.title,
        date: body.published_date,
        coverImageUrl: typeof body.cover_image === 'string' ? body.cover_image : undefined,
        tracklist,
      })

      sanityEpisodeId = episodeResult.sanityId
      sanitySlug = episodeResult.slug

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/episodes/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mixcloudKey, title: body.title, tracklist, tags: [] }),
      }).catch(err => console.warn('AI description generation failed:', err))

    } catch (episodeError) {
      console.error('Sanity episode creation failed:', episodeError)
      // Non-fatal: show was already saved to database
    }

    // 5. Prepare response
    const response: CreateShowResponse = {
      success: errors.length === 0,
      show_id: showId,
      sanity_episode_id: sanityEpisodeId,
      sanity_slug: sanitySlug,
      tracks_count: tracksCount,
      errors,
      warnings,
      message: `Show created successfully${sanitySlug ? ` — episode at /episodes/${sanitySlug}` : ''}`
    }

    const statusCode = errors.length > 0 ? 207 : 200

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Create show error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 })
  }
})

/**
 * Generate Mixcloud embed code from URL
 */
function generateMixcloudEmbed(mixcloudUrl: string): string {
  try {
    const url = new URL(mixcloudUrl)
    const path = url.pathname

    return `<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(path)}" frameborder="0"></iframe>`
  } catch (error) {
    console.warn('Invalid Mixcloud URL for embed generation:', mixcloudUrl)
    return ''
  }
}

export const POST = handler