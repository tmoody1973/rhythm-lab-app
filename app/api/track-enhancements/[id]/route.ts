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
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

        // YouTube data (cached first, then API fallback)
        (async () => {
          try {
            console.log('📺 Fetching YouTube data...')

            // FIRST: Try to get cached YouTube data
            const cachedData = await getCachedYouTubeData(trackId)

            if (cachedData) {
              console.log(`✅ YouTube: Using cached data - "${cachedData.video.title}" by ${cachedData.video.channelTitle}`)
              return cachedData
            }

            // FALLBACK: Use YouTube API if no cached data (but only occasionally)
            // This helps with new tracks while preserving quota for existing ones
            console.log('💡 No cached YouTube data, making API call...')
            const data = await getYouTubeTrackData(basicTrackData.artist, basicTrackData.song)

            if (data) {
              console.log(`✅ YouTube API: Found video "${data.video.title}" by ${data.video.channelTitle}`)
              // Note: We could optionally cache this data here, but it's better to do it in batches
              return { ...data, cached: false }
            } else {
              console.log('❌ YouTube API: No match found')
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
 * Get cached YouTube data from database
 * This avoids hitting the YouTube API repeatedly
 */
async function getCachedYouTubeData(trackId: string) {
  try {
    // Determine table based on track ID prefix
    const table = trackId.startsWith('live_song_') ? 'songs' : 'mixcloud_tracks'

    // Extract the actual database ID from the Algolia object ID
    const dbId = trackId.replace('live_song_', '').replace('archive_track_', '')

    console.log(`🎵 Checking YouTube cache in ${table} for ID: ${dbId}`)

    const { data, error } = await supabase
      .from(table)
      .select('youtube_url, youtube_video_id, youtube_thumbnail, youtube_title, youtube_channel, youtube_duration, youtube_view_count, youtube_cached_at')
      .eq('id', dbId)
      .single()

    if (error) {
      console.log(`No cached YouTube data found in ${table} for ${dbId}`)
      return null
    }

    if (data.youtube_url) {
      console.log(`✅ Found cached YouTube data: "${data.youtube_title}" by ${data.youtube_channel}`)

      // Format the data to match the YouTube API response structure
      return {
        video: {
          id: data.youtube_video_id,
          title: data.youtube_title,
          channelTitle: data.youtube_channel,
          thumbnail: data.youtube_thumbnail,
          duration: data.youtube_duration,
          viewCount: data.youtube_view_count,
          embedUrl: `https://www.youtube.com/embed/${data.youtube_video_id}`,
          watchUrl: data.youtube_url
        },
        videoId: data.youtube_video_id,
        embedUrl: `https://www.youtube.com/embed/${data.youtube_video_id}`,
        watchUrl: data.youtube_url,
        thumbnail: data.youtube_thumbnail,
        isOfficialChannel: data.youtube_channel?.toLowerCase().includes('vevo') ||
                          data.youtube_channel?.toLowerCase().includes('official') || false,
        hasHighViews: data.youtube_view_count ?
                      parseInt(data.youtube_view_count.replace(/[^\d]/g, '')) > 1000000 : false,
        cached: true,
        cachedAt: data.youtube_cached_at
      }
    }

    // YouTube data was attempted but no video found
    if (data.youtube_cached_at) {
      console.log(`No YouTube video exists for this track (cached at ${data.youtube_cached_at})`)
      return null
    }

    // No cache attempt yet
    console.log(`No YouTube cache attempt yet for ${dbId}`)
    return null

  } catch (error) {
    console.error('Error getting cached YouTube data:', error)
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