import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // First, let's test basic database connectivity
    console.log('Testing database connection...')

    // Check if tables exist
    const { data: tablesData, error: tablesError } = await supabase
      .from('songs')
      .select('count', { count: 'exact', head: true })

    if (tablesError) {
      console.error('Songs table error:', tablesError)
      return NextResponse.json({
        error: 'Songs table not accessible',
        details: tablesError.message
      }, { status: 500 })
    }

    // Check live_stream table
    const { data: liveStreamData, error: liveStreamError } = await supabase
      .from('live_stream')
      .select('*')
      .limit(1)

    if (liveStreamError) {
      console.error('Live stream table error:', liveStreamError)
      return NextResponse.json({
        error: 'Live stream table not accessible',
        details: liveStreamError.message
      }, { status: 500 })
    }

    // Insert a test live stream record if none exists
    if (!liveStreamData || liveStreamData.length === 0) {
      const { data: insertedLiveStream, error: insertError } = await supabase
        .from('live_stream')
        .insert({
          is_live: true,
          current_track_title: 'Weightless',
          current_track_artist: 'Marconi Union',
          current_show_title: 'Rhythm Lab Radio',
          listeners_count: 42,
          stream_url: 'https://example.com/stream',
          updated_at: new Date().toISOString()
        })
        .select()

      if (insertError) {
        console.error('Failed to insert live stream:', insertError)
        return NextResponse.json({
          error: 'Failed to insert test live stream',
          details: insertError.message
        }, { status: 500 })
      }
    }

    // Insert a test song if none exists
    const { data: songsData, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .limit(1)

    if (!songsData || songsData.length === 0) {
      const { data: insertedSong, error: songInsertError } = await supabase
        .from('songs')
        .insert({
          spinitron_id: 12345, // Required field
          song: 'Weightless',
          artist: 'Marconi Union',
          release: 'Weightless',
          label: 'Just Music',
          station_id: 'rlr-main',
          start_time: new Date().toISOString(),
          duration: 480,
          episode_title: 'Ambient Soundscapes'
        })
        .select()

      if (songInsertError) {
        console.error('Failed to insert song:', songInsertError)
        return NextResponse.json({
          error: 'Failed to insert test song',
          details: songInsertError.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      songsCount: tablesData,
      liveStreamExists: liveStreamData && liveStreamData.length > 0,
      testDataInserted: true
    })

  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}