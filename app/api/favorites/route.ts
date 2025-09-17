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

    // Parse live track favorites (which store track info in item_id)
    const processedFavorites = favorites.map(fav => {
      if (fav.item_type === 'live_track') {
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
    const { track, action } = body

    if (!track || !track.title || !track.artist) {
      return NextResponse.json(
        { error: 'Track title and artist are required' },
        { status: 400 }
      )
    }

    const itemId = `${track.artist}||${track.title}`

    if (action === 'remove') {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('item_type', 'live_track')
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
          item_type: 'live_track',
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