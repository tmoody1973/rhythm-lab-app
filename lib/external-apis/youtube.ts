/**
 * YouTube Data API v3 Integration
 * Handles searching for videos by artist and track name with rate limiting
 */

interface YouTubeSearchResponse {
  kind: string
  etag: string
  nextPageToken?: string
  prevPageToken?: string
  regionCode?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: YouTubeVideo[]
}

interface YouTubeVideo {
  kind: string
  etag: string
  id: {
    kind: string
    videoId?: string
    channelId?: string
    playlistId?: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: YouTubeThumbnail
      medium: YouTubeThumbnail
      high: YouTubeThumbnail
    }
    channelTitle: string
    liveBroadcastContent: string
    publishTime: string
  }
}

interface YouTubeThumbnail {
  url: string
  width: number
  height: number
}

interface YouTubeSearchResult {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  videoUrl: string
  publishedAt: string
}

interface YouTubeApiError {
  error: {
    code: number
    message: string
    errors: Array<{
      domain: string
      reason: string
      message: string
    }>
  }
}

class YouTubeRateLimiter {
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessing = false
  private requestCount = 0
  private dailyQuotaUsed = 0
  private lastResetTime = new Date()

  // Rate limiting constants
  private readonly MAX_REQUESTS_PER_SECOND = 10 // Conservative limit
  private readonly MAX_DAILY_QUOTA = 9000 // Leave buffer from 10k limit
  private readonly SEARCH_QUOTA_COST = 100

  async addToQueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.requestQueue.length > 0) {
      // Check daily quota
      if (this.dailyQuotaUsed >= this.MAX_DAILY_QUOTA) {
        console.warn('YouTube API daily quota limit reached')
        break
      }

      // Check if we need to reset daily counter
      const now = new Date()
      if (now.getDate() !== this.lastResetTime.getDate()) {
        this.dailyQuotaUsed = 0
        this.requestCount = 0
        this.lastResetTime = now
      }

      // Rate limiting per second
      if (this.requestCount >= this.MAX_REQUESTS_PER_SECOND) {
        await this.sleep(1000)
        this.requestCount = 0
      }

      const request = this.requestQueue.shift()
      if (request) {
        await request()
        this.requestCount++
        this.dailyQuotaUsed += this.SEARCH_QUOTA_COST

        // Small delay between requests
        await this.sleep(100)
      }
    }

    this.isProcessing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getQuotaStatus() {
    return {
      dailyQuotaUsed: this.dailyQuotaUsed,
      maxDailyQuota: this.MAX_DAILY_QUOTA,
      percentageUsed: (this.dailyQuotaUsed / this.MAX_DAILY_QUOTA) * 100,
      estimatedRequestsRemaining: Math.floor((this.MAX_DAILY_QUOTA - this.dailyQuotaUsed) / this.SEARCH_QUOTA_COST)
    }
  }
}

// Global rate limiter instance
const rateLimiter = new YouTubeRateLimiter()

/**
 * Search YouTube for a video by artist and track name
 */
export async function searchYouTubeVideo(
  artist: string,
  trackName: string,
  options: {
    maxResults?: number
    safeSearch?: 'moderate' | 'none' | 'strict'
    videoOnly?: boolean
  } = {}
): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not configured')
    return null
  }

  const {
    maxResults = 1,
    safeSearch = 'moderate',
    videoOnly = true
  } = options

  // Clean and prepare search query - AGGRESSIVE cleaning
  // Remove all types of quotes and problematic characters
  const cleanArtist = artist
    .replace(/["""''`''„""「」『』]/g, '') // Remove all quote types
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const cleanTrackName = trackName
    .replace(/["""''`''„""「」『』]/g, '') // Remove all quote types
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  const query = `${cleanArtist} ${cleanTrackName}`.trim()
  const searchQuery = encodeURIComponent(query)

  // Debug logging to see what we're actually searching for
  console.log(`[YouTube API] Original: "${artist}" - "${trackName}"`)
  console.log(`[YouTube API] Cleaned: "${cleanArtist}" - "${cleanTrackName}"`)
  console.log(`[YouTube API] Final query: "${query}"`)

  try {
    const result = await rateLimiter.addToQueue(async () => {
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('q', searchQuery)
      url.searchParams.set('key', apiKey)
      url.searchParams.set('maxResults', maxResults.toString())
      url.searchParams.set('safeSearch', safeSearch)
      url.searchParams.set('order', 'relevance')

      if (videoOnly) {
        url.searchParams.set('type', 'video')
      }

      console.log(`[YouTube API] Searching for: "${query}"`)

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData: YouTubeApiError = await response.json()
        throw new Error(`YouTube API error (${response.status}): ${errorData.error.message}`)
      }

      return response.json() as Promise<YouTubeSearchResponse>
    })

    if (result.items && result.items.length > 0) {
      const video = result.items[0]

      // Only return videos (not channels or playlists)
      if (video.id.videoId) {
        const searchResult: YouTubeSearchResult = {
          videoId: video.id.videoId,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
          videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          publishedAt: video.snippet.publishedAt
        }

        console.log(`[YouTube API] Found video: ${searchResult.title} by ${searchResult.channelTitle}`)
        return searchResult
      }
    }

    console.log(`[YouTube API] No video found for: "${query}"`)
    return null

  } catch (error) {
    console.error('[YouTube API] Search error:', error)

    // Handle quota exceeded errors specifically
    if (error instanceof Error && error.message.includes('quotaExceeded')) {
      console.error('[YouTube API] Daily quota exceeded')
    }

    return null
  }
}

/**
 * Batch search YouTube videos for multiple tracks
 */
export async function batchSearchYouTubeVideos(
  tracks: Array<{ artist: string; trackName: string; id?: string }>,
  onProgress?: (completed: number, total: number, currentTrack: string) => void
): Promise<Array<{
  trackId?: string
  artist: string
  trackName: string
  youtubeResult: YouTubeSearchResult | null
}>> {
  const results = []

  console.log(`[YouTube API] Starting batch search for ${tracks.length} tracks`)

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    const currentTrack = `${track.artist} - ${track.trackName}`

    if (onProgress) {
      onProgress(i, tracks.length, currentTrack)
    }

    const youtubeResult = await searchYouTubeVideo(track.artist, track.trackName)

    results.push({
      trackId: track.id,
      artist: track.artist,
      trackName: track.trackName,
      youtubeResult
    })

    // Log quota status periodically
    if ((i + 1) % 10 === 0) {
      const quotaStatus = rateLimiter.getQuotaStatus()
      console.log(`[YouTube API] Quota status: ${quotaStatus.dailyQuotaUsed}/${quotaStatus.maxDailyQuota} (${quotaStatus.percentageUsed.toFixed(1)}%)`)
    }
  }

  if (onProgress) {
    onProgress(tracks.length, tracks.length, 'Completed')
  }

  const successCount = results.filter(r => r.youtubeResult !== null).length
  console.log(`[YouTube API] Batch search completed: ${successCount}/${tracks.length} tracks found`)

  return results
}

/**
 * Get current quota usage status
 */
export function getYouTubeQuotaStatus() {
  return rateLimiter.getQuotaStatus()
}

/**
 * Generate YouTube embed URL for a video ID
 */
export function getYouTubeEmbedUrl(videoId: string, options: {
  autoplay?: boolean
  controls?: boolean
  showinfo?: boolean
  modestbranding?: boolean
  rel?: boolean
} = {}): string {
  const {
    autoplay = false,
    controls = true,
    showinfo = false,
    modestbranding = true,
    rel = false
  } = options

  const params = new URLSearchParams()
  if (autoplay) params.set('autoplay', '1')
  if (!controls) params.set('controls', '0')
  if (!showinfo) params.set('showinfo', '0')
  if (modestbranding) params.set('modestbranding', '1')
  if (!rel) params.set('rel', '0')

  const paramString = params.toString()
  return `https://www.youtube.com/embed/${videoId}${paramString ? `?${paramString}` : ''}`
}

/**
 * Validate YouTube video URL and extract video ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // Handle different YouTube URL formats
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1) // Remove leading slash
    }

    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      return urlObj.searchParams.get('v')
    }

    if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname === '/embed/') {
      return urlObj.pathname.split('/')[2]
    }

    return null
  } catch (error) {
    return null
  }
}