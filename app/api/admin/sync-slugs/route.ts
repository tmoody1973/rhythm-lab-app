import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'

/**
 * POST /api/admin/sync-slugs
 * Sync Storyblok slugs to database for all shows that have a storyblok_id
 */
const handler = withAdminAuth(async (request: NextRequest): Promise<NextResponse> => {
  try {
    const storyblokToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN
    if (!storyblokToken) {
      return NextResponse.json({
        success: false,
        error: 'Storyblok access token not configured'
      }, { status: 500 })
    }

    // Create Supabase client with service role
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

    // Get all shows that have a storyblok_id but might have wrong/null slug
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('id, title, storyblok_id, slug')
      .not('storyblok_id', 'is', null)

    if (showsError) {
      console.error('Error fetching shows:', showsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch shows from database'
      }, { status: 500 })
    }

    if (!shows || shows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No shows found to sync',
        updated: 0
      })
    }

    console.log(`Found ${shows.length} shows with storyblok_id`)

    let updated = 0
    let errors: string[] = []

    // Process each show
    for (const show of shows) {
      try {
        // Fetch the story from Storyblok to get its slug
        const response = await fetch(
          `https://api.storyblok.com/v2/cdn/stories/${show.storyblok_id}?token=${storyblokToken}&version=published`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Rhythm Lab Radio App'
            }
          }
        )

        if (!response.ok) {
          console.error(`Failed to fetch story ${show.storyblok_id}: ${response.status}`)
          errors.push(`Show "${show.title}": Failed to fetch from Storyblok (${response.status})`)
          continue
        }

        const data = await response.json()
        const storyblokSlug = data.story?.slug

        if (!storyblokSlug) {
          console.error(`No slug found for story ${show.storyblok_id}`)
          errors.push(`Show "${show.title}": No slug found in Storyblok`)
          continue
        }

        // Update the database with the Storyblok slug
        const { error: updateError } = await supabase
          .from('shows')
          .update({
            slug: storyblokSlug,
            updated_at: new Date().toISOString()
          })
          .eq('id', show.id)

        if (updateError) {
          console.error(`Failed to update show ${show.id}:`, updateError)
          errors.push(`Show "${show.title}": ${updateError.message}`)
        } else {
          console.log(`✅ Updated slug for "${show.title}": ${storyblokSlug}`)
          updated++
        }
      } catch (error) {
        console.error(`Error processing show ${show.id}:`, error)
        errors.push(`Show "${show.title}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updated} of ${shows.length} shows`,
      updated,
      total: shows.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Sync slugs error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

export const POST = handler