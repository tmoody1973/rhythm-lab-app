/**
 * Mixcloud API Integration Service
 *
 * Provides functionality to fetch shows from Mixcloud API with:
 * - Pagination handling for large collections
 * - Rate limiting and retry mechanisms
 * - Error handling and logging
 * - Data transformation to standardized format
 */

// Types for Mixcloud API responses
export interface MixcloudShow {
  key: string
  url: string
  name: string
  description: string
  created_time: string
  updated_time: string
  play_count: number
  favorite_count: number
  comment_count: number
  listener_count: number
  repost_count: number
  pictures: {
    small: string
    medium: string
    large: string
    '320wx320h': string
    '640wx640h': string
    thumbnail: string
    medium_mobile: string
  }
  slug: string
  user: {
    key: string
    url: string
    name: string
    username: string
    pictures: {
      small: string
      medium: string
      large: string
      thumbnail: string
    }
  }
  audio_length: number
  sections: Array<{
    start_time: number
    track: {
      key: string
      url: string
      name: string
      artist: {
        key: string
        url: string
        name: string
      }
    }
  }>
  tags: Array<{
    key: string
    url: string
    name: string
  }>
}

export interface MixcloudApiResponse {
  name: string
  data: MixcloudShow[]
  paging: {
    previous?: string
    next?: string
  }
}

// Standardized format for internal use
export interface StandardizedShow {
  id: string
  title: string
  description: string
  url: string
  createdAt: Date
  updatedAt: Date
  playCount: number
  favoriteCount: number
  duration: number
  artwork: {
    small: string
    medium: string
    large: string
  }
  user: {
    id: string
    name: string
    username: string
    avatar: string
  }
  tracks: Array<{
    startTime: number
    title: string
    artist: string
  }>
  tags: string[]
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    hasNext: boolean
    nextUrl?: string
    total: number
    page: number
    limit: number
  }
  meta: {
    requestTime: number
    cached: boolean
  }
}

// Configuration for the service
interface MixcloudServiceConfig {
  baseUrl: string
  userAgent: string
  rateLimitDelay: number
  maxRetries: number
  requestTimeout: number
}

// Rate limiting helper
class RateLimiter {
  private lastRequestTime = 0

  constructor(private delayMs: number) {}

  async throttle(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.delayMs) {
      const delay = this.delayMs - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    this.lastRequestTime = Date.now()
  }
}

export class MixcloudApiService {
  private config: MixcloudServiceConfig
  private rateLimiter: RateLimiter

  constructor(config?: Partial<MixcloudServiceConfig>) {
    this.config = {
      baseUrl: 'https://api.mixcloud.com',
      userAgent: 'RhythmLab/1.0 (Admin Import Tool)',
      rateLimitDelay: 1000, // 1 second between requests to be respectful
      maxRetries: 3,
      requestTimeout: 30000, // 30 seconds
      ...config
    }

    this.rateLimiter = new RateLimiter(this.config.rateLimitDelay)
  }

  /**
   * Fetch shows for a specific user with pagination
   */
  async fetchUserShows(
    username: string,
    options: {
      limit?: number
      offset?: number
      nextUrl?: string
    } = {}
  ): Promise<PaginatedResult<StandardizedShow>> {
    const startTime = Date.now()

    try {
      await this.rateLimiter.throttle()

      let url: string
      if (options.nextUrl) {
        // Use provided next URL for pagination
        url = options.nextUrl
      } else {
        // Build initial URL
        const limit = options.limit || 20
        const offset = options.offset || 0
        url = `${this.config.baseUrl}/${username}/cloudcasts/?limit=${limit}&offset=${offset}`
      }

      console.log(`Fetching Mixcloud shows: ${url}`)

      const response = await this.makeRequest(url)
      const data: MixcloudApiResponse = await response.json()

      // Transform the data to standardized format
      const standardizedShows = data.data.map(this.transformShow)

      return {
        data: standardizedShows,
        pagination: {
          hasNext: !!data.paging.next,
          nextUrl: data.paging.next,
          total: standardizedShows.length, // Mixcloud doesn't provide total count
          page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
          limit: options.limit || 20
        },
        meta: {
          requestTime: Date.now() - startTime,
          cached: false
        }
      }

    } catch (error) {
      console.error('Error fetching Mixcloud shows:', error)
      throw new Error(`Failed to fetch shows for user ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch all shows for a user (handles pagination automatically)
   */
  async fetchAllUserShows(
    username: string,
    options: {
      batchSize?: number
      maxShows?: number
      onProgress?: (shows: StandardizedShow[], total: number) => void
    } = {}
  ): Promise<StandardizedShow[]> {
    const allShows: StandardizedShow[] = []
    const batchSize = options.batchSize || 50
    const maxShows = options.maxShows || Infinity

    let nextUrl: string | undefined
    let hasMore = true

    while (hasMore && allShows.length < maxShows) {
      try {
        const result = await this.fetchUserShows(username, {
          limit: Math.min(batchSize, maxShows - allShows.length),
          nextUrl
        })

        allShows.push(...result.data)

        // Call progress callback if provided
        if (options.onProgress) {
          options.onProgress(result.data, allShows.length)
        }

        hasMore = result.pagination.hasNext
        nextUrl = result.pagination.nextUrl

        console.log(`Fetched ${allShows.length} shows so far...`)

      } catch (error) {
        console.error('Error in batch fetch:', error)
        // Break the loop on error to avoid infinite retries
        break
      }
    }

    console.log(`Completed fetch: ${allShows.length} shows total`)
    return allShows
  }

  /**
   * Fetch a single show by its key
   */
  async fetchShow(showKey: string): Promise<StandardizedShow> {
    try {
      await this.rateLimiter.throttle()

      const url = `${this.config.baseUrl}${showKey}`
      console.log(`Fetching single show: ${url}`)

      const response = await this.makeRequest(url)
      const data: MixcloudShow = await response.json()

      return this.transformShow(data)

    } catch (error) {
      console.error('Error fetching single show:', error)
      throw new Error(`Failed to fetch show ${showKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(url: string, retryCount = 0): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response

    } catch (error) {
      clearTimeout(timeoutId)

      if (retryCount < this.config.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
        console.log(`Request failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.config.maxRetries})`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequest(url, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Transform Mixcloud show data to standardized format
   */
  private transformShow(show: MixcloudShow): StandardizedShow {
    return {
      id: show.key,
      title: show.name,
      description: show.description || '',
      url: show.url,
      createdAt: new Date(show.created_time),
      updatedAt: new Date(show.updated_time),
      playCount: show.play_count || 0,
      favoriteCount: show.favorite_count || 0,
      duration: show.audio_length || 0,
      artwork: {
        small: show.pictures?.small || '',
        medium: show.pictures?.medium || show.pictures?.['320wx320h'] || '',
        large: show.pictures?.large || show.pictures?.['640wx640h'] || ''
      },
      user: {
        id: show.user?.key || '',
        name: show.user?.name || '',
        username: show.user?.username || '',
        avatar: show.user?.pictures?.medium || show.user?.pictures?.thumbnail || ''
      },
      tracks: (show.sections || []).map(section => ({
        startTime: section.start_time || 0,
        title: section.track?.name || '',
        artist: section.track?.artist?.name || ''
      })),
      tags: (show.tags || []).map(tag => tag.name).filter(Boolean)
    }
  }

  /**
   * Get service health/status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTime?: number
    error?: string
  }> {
    try {
      const startTime = Date.now()
      const response = await fetch(`${this.config.baseUrl}/discover/`, {
        method: 'HEAD',
        headers: {
          'User-Agent': this.config.userAgent
        }
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          status: 'healthy',
          responseTime
        }
      } else {
        return {
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Default instance
export const mixcloudApi = new MixcloudApiService()