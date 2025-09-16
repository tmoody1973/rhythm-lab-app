// API route for live stream status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {

    // Get live stream status
    const { data: liveStream, error: liveError } = await supabase
      .from('live_stream')
      .select('*')
      .limit(1)
      .single()

    if (liveError) {
      console.error('Failed to fetch live stream status:', liveError)
      return NextResponse.json(
        { error: 'Failed to fetch live stream status' },
        { status: 500 }
      )
    }

    // Get current song from database
    const { data: currentSong, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('station_id', 'rlr-main')
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      liveStream,
      currentSong: currentSong || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get live stream status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live stream status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      is_live,
      current_track_title,
      current_track_artist,
      current_show_title,
      listeners_count,
      stream_url
    } = body

    // Update live stream status
    const { data, error } = await supabase
      .from('live_stream')
      .update({
        is_live,
        current_track_title,
        current_track_artist,
        current_show_title,
        listeners_count,
        stream_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.from('live_stream').select('id').limit(1).single()).data?.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update live stream status:', error)
      return NextResponse.json(
        { error: 'Failed to update live stream status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to update live stream status:', error)
    return NextResponse.json(
      { error: 'Failed to update live stream status' },
      { status: 500 }
    )
  }
}