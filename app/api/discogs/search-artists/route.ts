import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { searchDiscogsArtists } from '@/lib/external-apis/discogs'

interface SearchArtistsRequest {
  query: string
  limit?: number
}

interface SearchArtistsResponse {
  success: boolean
  artists?: Array<{
    id: number
    name: string
    profile?: string
    images?: Array<{ type: string; uri: string }>
    resource_url: string
    uri: string
  }>
  message?: string
  error?: string
}

/**
 * POST /api/discogs/search-artists
 * Search for artists on Discogs to allow user selection
 */
const handler = withAdminAuth(async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: SearchArtistsRequest = await request.json()
    const { query, limit = 10 } = body

    if (!query?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 })
    }

    console.log(`[Artist Search API] Searching for: "${query}" (limit: ${limit})`)

    const artists = await searchDiscogsArtists(query, limit)

    if (!artists || artists.length === 0) {
      return NextResponse.json({
        success: true,
        artists: [],
        message: `No artists found for "${query}"`
      })
    }

    console.log(`[Artist Search API] Found ${artists.length} artists`)

    return NextResponse.json({
      success: true,
      artists: artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        profile: artist.profile || '',
        images: artist.images || [],
        resource_url: artist.resource_url,
        uri: artist.uri
      })),
      message: `Found ${artists.length} artists for "${query}"`
    })

  } catch (error) {
    console.error('Artist search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search artists'
    }, { status: 500 })
  }
})

export { handler as POST }