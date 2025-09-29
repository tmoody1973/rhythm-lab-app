import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminClient, INDICES } from '@/lib/algolia/client'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = (await headers()).get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In production, Vercel automatically adds CRON_SECRET
      // For now, we'll allow it to work without auth in development
      const isProduction = process.env.VERCEL_ENV === 'production'
      if (isProduction && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!adminClient) {
      console.error('Algolia admin client not configured')
      return NextResponse.json(
        { error: 'Algolia admin client not configured' },
        { status: 500 }
      )
    }

    // Only fetch songs from the last 24 hours for efficiency
    // This keeps the index fresh while avoiding unnecessary updates
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Fetch recent songs from Spinitron data
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .gte('start_time', twentyFourHoursAgo.toISOString())
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch songs from database' },
        { status: 500 }
      )
    }

    if (!songs || songs.length === 0) {
      console.log('No recent songs to sync')
      return NextResponse.json({
        success: true,
        message: 'No recent songs to sync',
        checked_at: new Date().toISOString()
      })
    }

    // Transform only the recent songs
    const algoliaObjects = songs.map((song: any) => {
      const startTime = new Date(song.start_time)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      // Generate time display
      let timeDisplay = ''
      if (diffMins <= 1) {
        timeDisplay = 'Just now'
      } else if (diffMins < 60) {
        timeDisplay = `${diffMins} minutes ago`
      } else if (diffHours < 24) {
        timeDisplay = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else {
        timeDisplay = 'Yesterday'
      }

      return {
        objectID: `live_song_${song.id}`,

        // Core fields
        song: song.song || '',
        artist: song.artist || '',
        release: song.release || '',
        label: song.label || '',

        // Show context
        episode_title: song.episode_title || '',

        // Timing
        start_time: startTime.toISOString(),
        start_timestamp: startTime.getTime(),
        duration: song.duration || 0,

        // Display
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

        // Metadata
        station_id: song.station_id || '',
        spotify_track_id: song.spotify_track_id || '',
        spotify_artist_id: song.spotify_artist_id || '',
        has_spotify_data: !!(song.spotify_track_id || song.spotify_artist_id),
        enhanced_metadata: song.enhanced_metadata || {},

        // Classification
        content_type: 'live_song',
        source: 'spinitron',

        // Search optimization
        searchable_text: [
          song.song,
          song.artist,
          song.release,
          song.label
        ].filter(Boolean).join(' '),

        // Context
        display_context: `Live • ${timeDisplay}`,

        // Faceting
        is_recent: true,
        is_today: diffHours < 24,
        sync_timestamp: now.getTime()
      }
    })

    // Use partialUpdateObjects for efficiency - only updates changed records
    console.log(`Syncing ${algoliaObjects.length} recent songs to Algolia...`)

    const { taskID } = await adminClient.saveObjects({
      indexName: INDICES.LIVE_SONGS,
      objects: algoliaObjects
    })

    // Optional: Clean up old records (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get old record IDs to delete
    const { data: oldSongs } = await supabase
      .from('songs')
      .select('id')
      .lt('start_time', sevenDaysAgo.toISOString())

    if (oldSongs && oldSongs.length > 0) {
      const oldObjectIDs = oldSongs.map(s => `live_song_${s.id}`)
      await adminClient.deleteObjects({
        indexName: INDICES.LIVE_SONGS,
        objectIDs: oldObjectIDs
      })
      console.log(`Cleaned up ${oldObjectIDs.length} old songs from index`)
    }

    console.log(`Live songs sync completed with task ID: ${taskID}`)

    return NextResponse.json({
      success: true,
      message: `Synced ${algoliaObjects.length} recent songs`,
      taskID,
      synced_count: algoliaObjects.length,
      cleaned_count: oldSongs?.length || 0,
      next_sync: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Live songs sync error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync live songs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  // Check for admin token for manual triggers
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return GET(request)
}