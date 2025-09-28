// YouTube Data API v3 Integration
// For searching and retrieving music videos related to releases

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration?: string
  viewCount?: string
  embedUrl: string
  watchUrl: string
}

export interface YouTubeSearchResponse {
  success: boolean
  videos: YouTubeVideo[]
  error?: string
}

/**
 * Search YouTube for videos related to an artist and album
 */
export async function searchYouTubeVideos(
  artist: string,
  album: string,
  maxResults: number = 6
): Promise<YouTubeSearchResponse> {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return {
        success: false,
        videos: [],
        error: 'YouTube API key not configured'
      }
    }

    // Create prioritized search queries for better relevance
    const queries = [
      `"${artist}" "${album}" full album`,
      `"${artist}" "${album}" official`,
      `${artist} ${album} album`,
      `${artist} ${album} music video`,
      `${artist} ${album} official video`
    ]

    const allVideos: YouTubeVideo[] = []
    const seenVideoIds = new Set<string>()

    // Try multiple search queries to get better results
    for (let i = 0; i < Math.min(queries.length, 3); i++) {
      const query = queries[i]
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
      searchUrl.searchParams.set('part', 'snippet')
      searchUrl.searchParams.set('q', query)
      searchUrl.searchParams.set('type', 'video')
      searchUrl.searchParams.set('maxResults', '6')
      searchUrl.searchParams.set('order', 'relevance')
      searchUrl.searchParams.set('videoDefinition', 'any')
      searchUrl.searchParams.set('videoEmbeddable', 'true')
      searchUrl.searchParams.set('videoCategoryId', '10') // Music category
      searchUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY)

      console.log(`[YouTube API] Searching (${i + 1}/${Math.min(queries.length, 3)}): ${query}`)

      try {
        const response = await fetch(searchUrl.toString())

        if (!response.ok) {
          console.warn(`[YouTube API] Query ${i + 1} failed: ${response.status}`)
          continue
        }

        const data = await response.json()

        if (data.error) {
          console.warn(`[YouTube API] Query ${i + 1} error:`, data.error.message)
          continue
        }

        // Transform and filter the response
        const videos: YouTubeVideo[] = (data.items || [])
          .filter((item: any) => {
            // Filter out duplicates and irrelevant content
            if (seenVideoIds.has(item.id.videoId)) return false

            const title = item.snippet.title.toLowerCase()
            const description = item.snippet.description.toLowerCase()
            const artistLower = artist.toLowerCase()
            const albumLower = album.toLowerCase()

            // Must contain artist name
            if (!title.includes(artistLower) && !description.includes(artistLower)) return false

            // Skip obvious non-matches
            if (title.includes('reaction') || title.includes('review') || title.includes('unboxing')) return false

            return true
          })
          .map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
            watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }))

        // Add new videos to our collection
        videos.forEach(video => {
          if (!seenVideoIds.has(video.id)) {
            seenVideoIds.add(video.id)
            allVideos.push(video)
          }
        })

        // Break early if we have enough results
        if (allVideos.length >= maxResults) break

      } catch (error) {
        console.warn(`[YouTube API] Query ${i + 1} failed:`, error)
        continue
      }
    }

    // Sort by relevance score (prioritize official channels and exact matches)
    const sortedVideos = allVideos
      .map(video => ({
        ...video,
        relevanceScore: calculateRelevanceScore(video, artist, album)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)

    // Get additional details for the top videos
    if (sortedVideos.length > 0) {
      const videoIds = sortedVideos.map(v => v.id).join(',')
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
      detailsUrl.searchParams.set('part', 'contentDetails,statistics')
      detailsUrl.searchParams.set('id', videoIds)
      detailsUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY)

      try {
        const detailsResponse = await fetch(detailsUrl.toString())
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()

          // Merge the details back into our videos
          sortedVideos.forEach(video => {
            const details = detailsData.items?.find((item: any) => item.id === video.id)
            if (details) {
              video.duration = formatDuration(details.contentDetails.duration)
              video.viewCount = formatViewCount(details.statistics.viewCount)
            }
          })
        }
      } catch (error) {
        console.warn('[YouTube API] Failed to get video details:', error)
        // Continue without details - not critical
      }
    }

    console.log(`[YouTube API] Found ${sortedVideos.length} relevant videos from ${allVideos.length} total`)

    return {
      success: true,
      videos: sortedVideos
    }

  } catch (error: any) {
    console.error('[YouTube API] Search error:', error)
    return {
      success: false,
      videos: [],
      error: error.message || 'Failed to search YouTube'
    }
  }
}

/**
 * Calculate relevance score for video matching
 */
function calculateRelevanceScore(video: YouTubeVideo, artist: string, album: string): number {
  let score = 0
  const title = video.title.toLowerCase()
  const description = video.description.toLowerCase()
  const channel = video.channelTitle.toLowerCase()
  const artistLower = artist.toLowerCase()
  const albumLower = album.toLowerCase()

  // Artist name in title (high priority)
  if (title.includes(artistLower)) score += 10

  // Album name in title
  if (title.includes(albumLower)) score += 8

  // Official indicators
  if (title.includes('official') || channel.includes('official') || channel.includes(artistLower)) score += 15

  // Full album indicators
  if (title.includes('full album') || title.includes('complete album')) score += 12

  // Music video indicators
  if (title.includes('music video') || title.includes('official video')) score += 10

  // Live performance indicators
  if (title.includes('live') || title.includes('concert') || title.includes('performance')) score += 5

  // Penalize reaction/review content
  if (title.includes('reaction') || title.includes('review') || title.includes('unboxing')) score -= 20

  // Exact artist match in channel name (very high priority)
  if (channel === artistLower || channel.includes(`${artistLower} official`)) score += 20

  return score
}

/**
 * Convert ISO 8601 duration (PT4M13S) to readable format (4:13)
 */
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

/**
 * Format view count to readable format (1.2M, 834K, etc.)
 */
function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount)
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`
  } else {
    return `${count} views`
  }
}

/**
 * TRACK-SPECIFIC SEARCH: Search for individual tracks/songs
 *
 * This is specifically designed for our track enhancement system.
 * Unlike the album search above, this focuses on finding individual songs.
 */
export async function searchYouTubeTrackVideo(
  artist: string,
  track: string
): Promise<YouTubeVideo | null> {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('YouTube API key not configured')
      return null
    }

    // Create optimized search queries for individual tracks
    const queries = [
      `"${artist}" "${track}" official music video`,    // Most specific
      `"${artist}" "${track}" official video`,          // Slightly broader
      `"${artist}" "${track}" music video`,             // Broader
      `${artist} ${track}`,                             // Fallback
    ]

    console.log(`🎵 YouTube: Searching for "${artist} - ${track}"`)

    // Try each query until we find a good match
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      console.log(`   Trying query ${i + 1}: "${query}"`)

      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
      searchUrl.searchParams.set('part', 'snippet')
      searchUrl.searchParams.set('q', query)
      searchUrl.searchParams.set('type', 'video')
      searchUrl.searchParams.set('maxResults', '10')
      searchUrl.searchParams.set('order', 'relevance')
      searchUrl.searchParams.set('videoEmbeddable', 'true')
      searchUrl.searchParams.set('videoCategoryId', '10') // Music category
      searchUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY)

      try {
        const response = await fetch(searchUrl.toString())

        if (!response.ok) {
          console.log(`   Query ${i + 1} failed: ${response.status}`)
          continue
        }

        const data = await response.json()

        if (data.error || !data.items?.length) {
          console.log(`   Query ${i + 1}: No results`)
          continue
        }

        // Find best match using our track-specific scoring
        const bestMatch = findBestTrackVideoMatch(data.items, artist, track)

        if (bestMatch) {
          // Get detailed statistics for the best match
          const details = await getVideoDetailsById(bestMatch.id.videoId)

          const result: YouTubeVideo = {
            id: bestMatch.id.videoId,
            title: bestMatch.snippet.title,
            description: bestMatch.snippet.description,
            thumbnail: bestMatch.snippet.thumbnails.high?.url || bestMatch.snippet.thumbnails.medium?.url,
            channelTitle: bestMatch.snippet.channelTitle,
            publishedAt: bestMatch.snippet.publishedAt,
            embedUrl: `https://www.youtube.com/embed/${bestMatch.id.videoId}`,
            watchUrl: `https://www.youtube.com/watch?v=${bestMatch.id.videoId}`,
            duration: details?.duration,
            viewCount: details?.viewCount
          }

          console.log(`✅ YouTube: Found "${result.title}" by ${result.channelTitle}`)
          return result
        }
      } catch (error) {
        console.log(`   Query ${i + 1} error:`, error)
        continue
      }
    }

    console.log('❌ YouTube: No suitable tracks found')
    return null

  } catch (error) {
    console.error('YouTube track search error:', error)
    return null
  }
}

/**
 * Enhanced track-specific video matching
 *
 * This uses more sophisticated logic than the album search
 * to find the best individual track match.
 */
function findBestTrackVideoMatch(items: any[], targetArtist: string, targetTrack: string): any | null {
  if (!items?.length) return null

  console.log(`   Analyzing ${items.length} results...`)

  const scored = items.map(item => {
    let score = 0
    const title = item.snippet.title.toLowerCase()
    const channel = item.snippet.channelTitle.toLowerCase()
    const description = item.snippet.description.toLowerCase()
    const artistLower = targetArtist.toLowerCase()
    const trackLower = targetTrack.toLowerCase()

    // CORE MATCHING: Artist and track in title
    const hasArtist = title.includes(artistLower)
    const hasTrack = title.includes(trackLower)

    if (hasArtist && hasTrack) {
      score += 100 // Perfect match
    } else if (hasArtist || hasTrack) {
      score += 40  // Partial match
    } else {
      score -= 20  // Poor match
    }

    // CHANNEL CREDIBILITY
    if (channel.includes('vevo')) score += 30           // Vevo = official
    if (channel.includes('official')) score += 25       // Official channels
    if (channel.includes(artistLower)) score += 20      // Artist's channel
    if (channel.includes('records')) score += 15        // Record labels

    // VIDEO TYPE PREFERENCES
    if (title.includes('official music video')) score += 25
    if (title.includes('official video')) score += 20
    if (title.includes('music video')) score += 15
    if (title.includes('official')) score += 10

    // AVOID UNWANTED CONTENT
    if (title.includes('cover')) score -= 25
    if (title.includes('remix')) score -= 20
    if (title.includes('karaoke')) score -= 30
    if (title.includes('instrumental')) score -= 20
    if (title.includes('reaction')) score -= 40
    if (title.includes('review')) score -= 35
    if (title.includes('lyrics only')) score -= 15

    console.log(`     "${item.snippet.title}" (${item.snippet.channelTitle}) = ${score} points`)
    return { item, score }
  })

  // Return best match if it's good enough
  const best = scored.sort((a, b) => b.score - a.score)[0]
  return best.score > 40 ? best.item : null
}

/**
 * Get detailed video information by ID
 */
async function getVideoDetailsById(videoId: string): Promise<{duration: string, viewCount: string} | null> {
  try {
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('part', 'contentDetails,statistics')
    detailsUrl.searchParams.set('id', videoId)
    detailsUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY!)

    const response = await fetch(detailsUrl.toString())

    if (!response.ok) return null

    const data = await response.json()
    const video = data.items?.[0]

    if (!video) return null

    return {
      duration: formatDuration(video.contentDetails.duration),
      viewCount: formatViewCount(video.statistics.viewCount)
    }
  } catch (error) {
    console.error('Error getting video details:', error)
    return null
  }
}

/**
 * MAIN FUNCTION: Get YouTube track data for our enhancement system
 *
 * This matches the pattern used in our Spotify integration
 */
export async function getYouTubeTrackData(artist: string, track: string) {
  console.log(`🎵 Getting YouTube data for: ${artist} - ${track}`)

  const video = await searchYouTubeTrackVideo(artist, track)

  if (!video) {
    return null
  }

  return {
    video,
    // Computed fields for easy use in our UI
    videoId: video.id,
    embedUrl: video.embedUrl,
    watchUrl: video.watchUrl,
    thumbnail: video.thumbnail,
    isOfficialChannel: video.channelTitle.toLowerCase().includes('vevo') ||
                      video.channelTitle.toLowerCase().includes('official'),
    hasHighViews: video.viewCount ? parseInt(video.viewCount.replace(/[^\d]/g, '')) > 1000000 : false
  }
}

/**
 * Generate contextual search queries for different types of music content
 */
export function generateMusicSearchQueries(artist: string, album: string): string[] {
  return [
    `${artist} ${album} full album`,
    `${artist} ${album} official music video`,
    `${artist} ${album} live performance`,
    `${artist} ${album} documentary`,
    `${artist} ${album} interview`,
    `${artist} ${album} making of`
  ]
}