// API route for Spinitron sync operations

import { NextRequest, NextResponse } from 'next/server'
import { spinitronSync } from '@/lib/spinitron/sync'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { operation = 'full', hours = 24 } = body

    switch (operation) {
      case 'current':
        const currentSong = await spinitronSync.syncCurrentSong()
        return NextResponse.json({
          success: true,
          operation: 'current',
          data: currentSong,
          timestamp: new Date().toISOString()
        })

      case 'recent':
        const recentSongs = await spinitronSync.syncRecentSongs(hours)
        return NextResponse.json({
          success: true,
          operation: 'recent',
          data: recentSongs,
          count: recentSongs.length,
          timestamp: new Date().toISOString()
        })

      case 'live-stream':
        await spinitronSync.updateLiveStreamStatus()
        return NextResponse.json({
          success: true,
          operation: 'live-stream',
          message: 'Live stream status updated',
          timestamp: new Date().toISOString()
        })

      case 'full':
      default:
        const result = await spinitronSync.performFullSync()
        return NextResponse.json({
          success: true,
          operation: 'full',
          data: {
            currentSong: result.currentSong,
            recentSongsCount: result.recentSongs.length,
            liveStreamUpdated: result.liveStreamUpdated
          },
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Spinitron sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Sync operation failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET route for sync status/health check
export async function GET(request: NextRequest) {
  try {
    // Just check if we can get current song without syncing
    const supabase = createClient()
    const { data: currentSong } = await supabase
      .from('songs')
      .select('*')
      .eq('station_id', 'rlr-main')
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    const isHealthy = !!currentSong

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      lastSong: currentSong ? {
        song: currentSong.song,
        artist: currentSong.artist,
        start_time: currentSong.start_time
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      healthy: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
}