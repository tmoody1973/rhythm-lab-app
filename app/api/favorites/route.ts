import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', session.user.id)
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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
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
        .eq('user_id', session.user.id)
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
          user_id: session.user.id,
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