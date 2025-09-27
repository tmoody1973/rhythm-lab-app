import { NextRequest, NextResponse } from 'next/server'

interface DiscogsSearchResult {
  id: number
  type: string
  title: string
  thumb?: string
  cover_image?: string
  resource_url: string
}

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[]
}

/**
 * GET /api/search/artists?q=search_query
 * Smart artist search endpoint for dropdown suggestions
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      artists: []
    })
  }

  try {
    const token = process.env.DISCOGS_API_TOKEN
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Discogs API not configured'
      }, { status: 500 })
    }

    // Use Discogs search with general query and artist type filter
    const searchQuery = encodeURIComponent(query)
    const url = `https://api.discogs.com/database/search?q=${searchQuery}&type=artist&per_page=8`

    console.log(`[Artist Search] Searching for: "${query}"`)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'RhythmLabRadio/1.0 +https://rhythmlabradio.com',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Discogs API error (${response.status}): ${errorData.message || 'Unknown error'}`)
    }

    const data: DiscogsSearchResponse = await response.json()

    // Filter and format artist results
    const artists = data.results
      .filter(result => result.type === 'artist')
      .map(artist => ({
        id: artist.id,
        name: artist.title,
        image: artist.thumb || artist.cover_image || null,
        discogsUrl: `https://www.discogs.com/artist/${artist.id}`,
        type: 'artist' as const
      }))

    console.log(`[Artist Search] Found ${artists.length} artists for "${query}"`)

    return NextResponse.json({
      success: true,
      query,
      artists
    })

  } catch (error) {
    console.error('[Artist Search] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 })
  }
}