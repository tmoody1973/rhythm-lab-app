import { NextRequest, NextResponse } from 'next/server'

interface BandcampEmbedRequest {
  url: string
}

interface BandcampEmbedResponse {
  success: boolean
  embedUrl?: string
  error?: string
}

/**
 * POST /api/bandcamp/get-embed-url
 * Extract Bandcamp album/track ID from URL and generate embed URL
 */
export async function POST(request: NextRequest): Promise<NextResponse<BandcampEmbedResponse>> {
  try {
    const body: BandcampEmbedRequest = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 })
    }

    // Fetch the Bandcamp page to extract album/track ID from the embed code
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RhythmLabBot/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Bandcamp page: ${response.status}`)
    }

    const html = await response.text()

    // Extract album/track ID from the page's embed code
    // Look for patterns like: album=3851894488 or track=123456789
    const albumMatch = html.match(/album[=\/](\d+)/)
    const trackMatch = html.match(/track[=\/](\d+)/)

    let embedUrl: string

    if (albumMatch) {
      const albumId = albumMatch[1]
      embedUrl = `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`
    } else if (trackMatch) {
      const trackId = trackMatch[1]
      embedUrl = `https://bandcamp.com/EmbeddedPlayer/track=${trackId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`
    } else {
      return NextResponse.json({
        success: false,
        error: 'Could not extract Bandcamp album/track ID from URL'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      embedUrl
    })

  } catch (error) {
    console.error('Bandcamp embed URL error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate embed URL'
    }, { status: 500 })
  }
}
