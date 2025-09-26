import { NextRequest, NextResponse } from 'next/server'
import { searchYouTubeVideos } from '@/lib/youtube/api'

interface VideoSearchRequest {
  artist: string
  album: string
  maxResults?: number
}

/**
 * POST /api/youtube/search-videos
 * Search YouTube for videos related to an artist and album
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VideoSearchRequest = await request.json()
    const { artist, album, maxResults = 6 } = body

    if (!artist || !album) {
      return NextResponse.json({
        success: false,
        error: 'Artist and album are required'
      }, { status: 400 })
    }

    console.log(`[YouTube Search API] Searching for: ${artist} - ${album}`)

    const result = await searchYouTubeVideos(artist, album, maxResults)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[YouTube Search API] Error:', error)
    return NextResponse.json({
      success: false,
      videos: [],
      error: error.message || 'Failed to search videos'
    }, { status: 500 })
  }
}