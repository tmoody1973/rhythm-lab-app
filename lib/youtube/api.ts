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