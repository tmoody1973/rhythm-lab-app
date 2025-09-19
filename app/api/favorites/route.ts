import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { auth } from '@clerk/nextjs/server'

// Helper function to get user ID for both Clerk and Supabase users
async function getUserId(supabase: any, request: NextRequest): Promise<string | null> {
  // Try server-side Clerk auth first
  try {
    const authResult = await auth()
    const userId = authResult.userId
    console.log('Clerk userId:', userId)

    if (userId) {
      // With Supabase's built-in Clerk integration, users should be in auth.users
      // Also ensure profile exists for this Clerk user
      await ensureProfileExists(supabase, userId)
      return userId
    }
  } catch (error) {
    console.log('Clerk auth error:', error)
  }

  // Fallback to Supabase auth (for admin users)
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Supabase fallback user:', { user: user?.id, error })
  return user?.id || null
}

// Helper function to ensure profile exists for Clerk users
async function ensureProfileExists(supabase: any, userId: string) {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!existingProfile) {
      // Since Supabase's Clerk integration isn't working, get user data from Clerk directly
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = clerkClient()

      try {
        const clerkUser = await client.users.getUser(userId)

        if (clerkUser) {
          // Create profile for this Clerk user
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId, // Use Clerk ID as profile ID
              clerk_user_id: userId,
              email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress,
              full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.primaryEmailAddress?.emailAddress,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            console.log('Profile creation error:', insertError)
          } else {
            console.log('Profile created for Clerk user:', userId)
          }
        }
      } catch (clerkError) {
        console.log('Error fetching user from Clerk:', clerkError)
      }
    }
  } catch (error) {
    console.log('Error ensuring profile exists:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use service role to bypass RLS for dual auth system
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // For GET requests, we don't need to set cookies
          },
        },
      }
    )

    const userId = await getUserId(supabase, request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      )
    }

    // Parse favorites based on type
    const processedFavorites = favorites.map(fav => {
      if (fav.item_type === 'live_track') {
        // Parse live track favorites (which store track info in item_id)
        const [artist, title] = fav.item_id.split('||')
        return {
          ...fav,
          track_data: {
            artist,
            title,
            type: 'live_track'
          }
        }
      }
      // For other content types (blog_post, deep_dive, artist_profile, show)
      // item_id is the actual ID and we don't need to parse it
      return fav
    })

    return NextResponse.json({ favorites: processedFavorites })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS for dual auth system
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // For POST requests, we don't need to set cookies
          },
        },
      }
    )

    const userId = await getUserId(supabase, request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { track, content, action } = body

    let itemId: string
    let itemType: string

    if (track && track.title && track.artist) {
      // Handle live tracks
      itemId = `${track.artist}||${track.title}`
      itemType = 'live_track'
    } else if (content && content.id && content.title && content.type) {
      // Handle blog posts, deep dives, profiles, etc.
      itemId = content.id
      itemType = content.type
    } else {
      return NextResponse.json(
        { error: 'Either track (with title and artist) or content (with id, title, and type) is required' },
        { status: 400 }
      )
    }

    if (action === 'remove') {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)

      if (error) {
        console.error('Error removing favorite:', error)
        return NextResponse.json(
          { error: 'Failed to remove favorite' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Favorite removed successfully' })
    } else {
      // Add favorite
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return NextResponse.json(
            { error: 'Track already favorited' },
            { status: 409 }
          )
        }
        console.error('Error adding favorite:', error)
        return NextResponse.json(
          { error: 'Failed to add favorite' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Favorite added successfully' })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}