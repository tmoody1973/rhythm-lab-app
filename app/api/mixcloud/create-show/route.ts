import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createMixcloudShowStory } from '@/lib/storyblok-management'
import { parsePlaylistText, tracksToDbFormat, tracksToStoryblokFormat } from '@/lib/playlist-parser'

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
  storyblok_id?: number
  storyblok_slug?: string
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
    let storyblokTracklist: any[] = []

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
        // Prepare tracks for Storyblok
        storyblokTracklist = tracksToStoryblokFormat(parseResult.tracks)
      }
    }

    // 4. Create Storyblok story
    let storyblokResponse: any = null
    try {
      storyblokResponse = await createMixcloudShowStory({
        title: body.title,
        description: body.description,
        mixcloudUrl: body.mixcloud_url,
        publishedDate,
        tracklist: storyblokTracklist,
        coverImageFile: body.cover_image,
        showId: showId
      })

      // Update show record with Storyblok ID and slug
      const { error: updateError } = await supabase
        .from('shows')
        .update({
          storyblok_id: storyblokResponse.story.id.toString(),
          slug: storyblokResponse.story.slug, // Save Storyblok's slug with timestamp
          updated_at: new Date().toISOString()
        })
        .eq('id', showId)

      if (updateError) {
        warnings.push(`Show created but failed to link Storyblok ID: ${updateError.message}`)
      }

    } catch (storyblokError) {
      const errorMessage = storyblokError instanceof Error ? storyblokError.message : 'Unknown Storyblok error'
      errors.push(`Storyblok story creation failed: ${errorMessage}`)
      console.error('Storyblok creation error:', storyblokError)
    }

    // 5. Prepare response
    const response: CreateShowResponse = {
      success: errors.length === 0,
      show_id: showId,
      tracks_count: tracksCount,
      errors,
      warnings,
      message: `Show created successfully${storyblokResponse ? ' and synced to Storyblok' : ''}`
    }

    if (storyblokResponse) {
      response.storyblok_id = storyblokResponse.story.id
      response.storyblok_slug = storyblokResponse.story.slug
    }

    const statusCode = errors.length > 0 ? (storyblokResponse ? 207 : 500) : 200

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