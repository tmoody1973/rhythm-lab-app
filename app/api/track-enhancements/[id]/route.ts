/**
 * Track Enhancement API
 *
 * This endpoint fetches enhanced data for tracks from external APIs.
 * Called by track pages to get Spotify, YouTube, and Discogs data.
 *
 * URL: /api/track-enhancements/[trackId]
 * Method: GET
 * Response: Enhanced track data from multiple sources
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchClient, INDICES } from '@/lib/algolia/client'
import { getSpotifyTrackData } from '@/lib/spotify/api'
import { getYouTubeTrackData } from '@/lib/youtube/api'

interface EnhancedTrackData {
  spotify?: {
    track: any
    audioFeatures: any
    recommendations: any[]
    hasPreview: boolean
    popularityLevel: string
    albumArt: string | null
  }
  youtube?: {
    video: any
    videoId: string
    embedUrl: string
    watchUrl: string
    thumbnail: string
    isOfficialChannel: boolean
    hasHighViews: boolean
  }
  // Discogs data will be added here later
  discogs?: any
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackId } = await params

  try {
    console.log(`Enhancing track: ${trackId}`)

    // STEP 1: Get basic track data from Algolia
    // We need artist and song name to search external APIs
    const basicTrackData = await getBasicTrackData(trackId)

    if (!basicTrackData) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      )
    }

    console.log(`Found basic data: ${basicTrackData.artist} - ${basicTrackData.song}`)

    // STEP 2: Fetch enhanced data from external APIs
    // This is where the magic happens!
    const enhancedData: EnhancedTrackData = {}

    // STEP 2A: Fetch Spotify data (audio preview, popularity, similar tracks)
    // STEP 2B: Fetch YouTube data (music video, view count, embedded player)
    // We run these in parallel for better performance!

    if (basicTrackData.artist && basicTrackData.song) {
      console.log('Fetching enhanced data from multiple APIs...')

      // Run Spotify and YouTube requests in parallel (faster!)
      const [spotifyData, youtubeData] = await Promise.all([
        // Spotify API call
        (async () => {
          try {
            console.log('🎵 Fetching Spotify data...')
            const data = await getSpotifyTrackData(basicTrackData.artist, basicTrackData.song)
            if (data) {
              console.log(`✅ Spotify: Found track with ${data.popularityLevel} popularity`)
              return data
            } else {
              console.log('❌ Spotify: No match found')
              return null
            }
          } catch (error) {
            console.error('❌ Spotify enhancement failed:', error)
            return null // Don't fail the whole request if one API fails
          }
        })(),

        // YouTube API call
        (async () => {
          try {
            console.log('📺 Fetching YouTube data...')
            const data = await getYouTubeTrackData(basicTrackData.artist, basicTrackData.song)
            if (data) {
              console.log(`✅ YouTube: Found video "${data.video.title}" by ${data.video.channelTitle}`)
              return data
            } else {
              console.log('❌ YouTube: No match found')
              return null
            }
          } catch (error) {
            console.error('❌ YouTube enhancement failed:', error)
            return null // Don't fail the whole request if one API fails
          }
        })()
      ])

      // Add the data if we got it
      if (spotifyData) enhancedData.spotify = spotifyData
      if (youtubeData) enhancedData.youtube = youtubeData
    }

    // TODO: Add Discogs integration here
    // enhancedData.discogs = await getDiscogsData(basicTrackData.artist, basicTrackData.song)

    // STEP 3: Return enhanced data
    const response = {
      success: true,
      trackId,
      basicData: basicTrackData,
      enhancedData,
      // Add metadata for debugging and tracking
      enhancementSources: {
        spotify: !!enhancedData.spotify,
        youtube: !!enhancedData.youtube,
        discogs: !!enhancedData.discogs
      },
      timestamp: new Date().toISOString()
    }

    console.log(`Enhancement complete for ${trackId}:`, response.enhancementSources)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Track enhancement error:', error)
    return NextResponse.json(
      {
        error: 'Failed to enhance track data',
        details: error instanceof Error ? error.message : 'Unknown error',
        trackId
      },
      { status: 500 }
    )
  }
}

/**
 * HELPER: Get Basic Track Data from Algolia
 *
 * Fetches the original track data we need for API searches.
 * This gives us artist name, song name, and other metadata.
 */
async function getBasicTrackData(trackId: string) {
  if (!searchClient) {
    throw new Error('Search client not available')
  }

  try {
    // Determine which Algolia index to search based on track ID prefix
    const indexName = trackId.startsWith('live_song_')
      ? INDICES.LIVE_SONGS
      : INDICES.ARCHIVE_TRACKS

    console.log(`Searching ${indexName} for track: ${trackId}`)

    // Search Algolia for the specific track
    const response = await searchClient.search([{
      indexName,
      query: '',
      filters: `objectID:"${trackId}"`
    }])

    const hit = response.results[0]?.hits[0]

    if (!hit) {
      console.log(`Track not found in ${indexName}: ${trackId}`)
      return null
    }

    // Extract the data we need for API searches
    const trackData = {
      objectID: hit.objectID,
      // Live songs use "song" and "artist" fields
      song: hit.song || hit.track || null,
      artist: hit.artist || null,
      // Additional context
      release: hit.release || null,
      label: hit.label || null,
      contentType: hit.content_type,
      // All other original data
      ...hit
    }

    return trackData

  } catch (error) {
    console.error('Error fetching basic track data:', error)
    return null
  }
}

/**
 * Future: Rate Limiting
 *
 * In production, you'd want to add rate limiting to prevent abuse:
 *
 * import { rateLimiter } from '@/lib/rate-limiter'
 *
 * const isAllowed = await rateLimiter.check(request.ip, 'track-enhancement', 10, '1m')
 * if (!isAllowed) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 * }
 */

/**
 * Future: Caching
 *
 * In production, cache successful API responses to avoid hitting rate limits:
 *
 * import { cache } from '@/lib/cache'
 *
 * const cacheKey = `track-enhancement:${trackId}`
 * const cached = await cache.get(cacheKey)
 * if (cached) {
 *   return NextResponse.json(cached)
 * }
 *
 * // ... fetch data ...
 *
 * await cache.set(cacheKey, response, '1h') // Cache for 1 hour
 */