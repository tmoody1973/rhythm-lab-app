import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminClient, INDICES } from '@/lib/algolia/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Algolia admin client not configured' },
        { status: 500 }
      )
    }

    // Get authentication (admin only)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch songs from the songs table (Spinitron data)
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch songs from database' },
        { status: 500 }
      )
    }

    if (!songs || songs.length === 0) {
      return NextResponse.json(
        { message: 'No songs found to index' },
        { status: 200 }
      )
    }

    // Transform songs into Algolia objects
    const algoliaObjects = songs.map((song: any) => {
      const startTime = new Date(song.start_time)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      // Create human-readable time display
      let timeDisplay = ''
      if (diffDays === 0) {
        if (diffHours === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60))
          timeDisplay = diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
        } else {
          timeDisplay = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        }
      } else if (diffDays === 1) {
        timeDisplay = 'Yesterday'
      } else if (diffDays < 7) {
        timeDisplay = `${diffDays} days ago`
      } else {
        timeDisplay = startTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }

      return {
        objectID: `live_song_${song.id}`,

        // Primary search fields
        song: song.song || '',
        artist: song.artist || '',
        release: song.release || '',
        label: song.label || '',

        // Episode/Show context
        episode_title: song.episode_title || '',

        // Temporal data
        start_time: startTime.toISOString(),
        start_timestamp: startTime.getTime(),
        duration: song.duration || 0,

        // Display formatting
        date_display: startTime.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        time_display: startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        relative_time: timeDisplay,

        // Enhanced metadata
        station_id: song.station_id || '',
        is_manual: song.is_manual || false,

        // Spotify integration
        spotify_track_id: song.spotify_track_id || '',
        spotify_artist_id: song.spotify_artist_id || '',
        spotify_album_id: song.spotify_album_id || '',
        has_spotify_data: !!(song.spotify_track_id || song.spotify_artist_id),

        // Enhanced metadata from JSON field
        enhanced_metadata: song.enhanced_metadata || {},

        // Content classification
        content_type: 'live_song',
        source: 'spinitron',

        // Search optimization
        searchable_text: [
          song.song,
          song.artist,
          song.release,
          song.label,
          song.episode_title
        ].filter(Boolean).join(' '),

        // Display context
        display_context: song.episode_title
          ? `Live on ${song.episode_title} • ${timeDisplay}`
          : `Live • ${timeDisplay}`,

        display_full: `${song.song} by ${song.artist}${song.release ? ` from ${song.release}` : ''}`,

        // Faceting helpers
        year: startTime.getFullYear(),
        month: startTime.getMonth() + 1,
        day_of_week: startTime.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: startTime.getHours(),
        is_recent: diffHours < 24,
        is_today: diffDays === 0
      }
    })

    // Index to Algolia
    console.log(`Indexing ${algoliaObjects.length} live songs...`)

    const { taskID } = await adminClient.replaceAllObjects({
      indexName: INDICES.LIVE_SONGS,
      objects: algoliaObjects,
      batchSize: 1000
    })

    console.log(`Live songs indexing started with task ID: ${taskID}`)

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${algoliaObjects.length} live songs for indexing`,
      taskID,
      indexed_count: algoliaObjects.length,
      date_range: {
        oldest: songs[songs.length - 1]?.start_time,
        newest: songs[0]?.start_time
      },
      sample_object: algoliaObjects[0] // For debugging
    })

  } catch (error) {
    console.error('Live songs indexing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to index live songs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Live Songs Indexing',
    description: 'POST to this endpoint to index songs table (Spinitron data) to Algolia',
    requirements: ['Bearer token authorization', 'Admin permissions'],
    data_source: 'songs table (Spinitron live stream data)',
    features: [
      'Human-readable time displays (Just now, 2 hours ago, Yesterday)',
      'Episode context and show information',
      'Spotify integration data',
      'Enhanced metadata support',
      'Faceting by time periods and recency'
    ]
  })
}