// API route to get current playing song from Spinitron

import { NextRequest, NextResponse } from 'next/server'
import { spinitronSync } from '@/lib/spinitron/sync'

export async function GET(request: NextRequest) {
  try {
    // Sync current song from Spinitron and return it
    const currentSong = await spinitronSync.syncCurrentSong()

    if (!currentSong) {
      return NextResponse.json(
        { error: 'No current song available' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: currentSong,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get current song:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current song' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force sync current song and update live stream status
    await spinitronSync.updateLiveStreamStatus()
    const currentSong = await spinitronSync.syncCurrentSong()

    return NextResponse.json({
      success: true,
      data: currentSong,
      message: 'Live stream status updated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to sync current song:', error)
    return NextResponse.json(
      { error: 'Failed to sync current song' },
      { status: 500 }
    )
  }
}