import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { auth } from '@clerk/nextjs/server'

// Helper function to ensure profile exists with correct email for Clerk users
async function ensureClerkProfile(userId: string): Promise<void> {
  try {
    // Get Clerk user details
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    if (!clerkUser) return

    // Use service role to manage profiles
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        cookies: {
          getAll() { return [] },
          setAll() {}
        }
      }
    )

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('clerk_user_id', userId)
      .single()

    const userEmail = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress
    const userFullName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userEmail

    if (existingProfile) {
      // Update if email is missing or incorrect
      if (!existingProfile.email || existingProfile.email.startsWith('user_') || existingProfile.email !== userEmail) {
        await supabase
          .from('profiles')
          .update({
            email: userEmail,
            full_name: userFullName,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', userId)

        console.log('Updated profile email for Clerk user:', userId)
      }
    } else {
      // Create new profile with proper email
      const { v4: uuidv4 } = await import('uuid')
      await supabase
        .from('profiles')
        .insert({
          id: uuidv4(),
          clerk_user_id: userId,
          email: userEmail,
          full_name: userFullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      console.log('Created profile for Clerk user:', userId, 'with email:', userEmail)
    }
  } catch (error) {
    console.log('Error ensuring profile:', error)
  }
}

// Helper function to get user ID for both Clerk and Supabase users
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try server-side Clerk auth first
  try {
    const authResult = await auth()
    const userId = authResult.userId
    console.log('Clerk userId:', userId)

    if (userId) {
      // Ensure profile exists with correct email
      await ensureClerkProfile(userId)
      // Return Clerk user ID directly - it will be used as-is in user_favorites
      return userId
    }
  } catch (error) {
    console.log('Clerk auth error:', error)
  }

  // Fallback to Supabase auth (for admin users)
  // Create a Supabase client to check for admin users
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // For GET/POST requests, we don't need to set cookies
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Supabase fallback user:', { user: user?.id, error })
  return user?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key to bypass RLS since we're handling auth manually
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
    const userId = await getUserId(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to bypass RLS for now
    // TODO: Once migration is run, we can use regular client with Clerk JWT
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