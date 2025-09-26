/**
 * Discogs API Integration
 * Handles searching for artists and releases with rate limiting
 */

interface DiscogsSearchResponse {
  pagination: {
    per_page: number
    pages: number
    page: number
    urls: {
      last?: string
      next?: string
    }
    items: number
  }
  results: DiscogsSearchResult[]
}

interface DiscogsSearchResult {
  id: number
  type: 'artist' | 'release' | 'master' | 'label'
  user_data?: {
    in_wantlist: boolean
    in_collection: boolean
  }
  master_id?: number
  master_url?: string
  uri: string
  title: string
  thumb: string
  cover_image: string
  resource_url: string
  country?: string
  year?: string
  format?: string[]
  label?: string[]
  genre?: string[]
  style?: string[]
  barcode?: string[]
  catno?: string
}

interface DiscogsArtist {
  id: number
  name: string
  realname?: string
  profile?: string
  releases_url: string
  resource_url: string
  uri: string
  urls?: string[]
  namevariations?: string[]
  aliases?: Array<{
    id: number
    name: string
    resource_url: string
  }>
  groups?: Array<{
    id: number
    name: string
    resource_url: string
  }>
  members?: Array<{
    id: number
    name: string
    resource_url: string
  }>
  images?: Array<{
    type: 'primary' | 'secondary'
    uri: string
    resource_url: string
    uri150: string
    width: number
    height: number
  }>
}

interface DiscogsRelease {
  id: number
  title: string
  artists: Array<{
    name: string
    anv: string
    join: string
    role: string
    tracks: string
    id: number
    resource_url: string
  }>
  year: number
  genres: string[]
  styles: string[]
  formats: Array<{
    name: string
    qty: string
    descriptions?: string[]
  }>
  thumb: string
  cover_image: string
  resource_url: string
  uri: string
  labels: Array<{
    name: string
    catno: string
    entity_type: string
    entity_type_name: string
    id: number
    resource_url: string
  }>
  community: {
    want: number
    have: number
    rating: {
      count: number
      average: number
    }
  }
}

interface DiscogsArtistResult {
  artistId: number
  name: string
  realname?: string
  profile?: string
  imageUrl?: string
  discogsUrl: string
  genres?: string[]
  aliases?: string[]
}

interface DiscogsApiError {
  message: string
}

class DiscogsRateLimiter {
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessing = false
  private requestCount = 0
  private lastRequestTime = 0

  // Discogs rate limiting: 60 requests per minute for authenticated requests
  private readonly MAX_REQUESTS_PER_MINUTE = 55 // Leave buffer
  private readonly REQUEST_INTERVAL = 60000 // 1 minute in milliseconds

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
      const now = Date.now()

      // Reset request count if a minute has passed
      if (now - this.lastRequestTime >= this.REQUEST_INTERVAL) {
        this.requestCount = 0
        this.lastRequestTime = now
      }

      // Check rate limit
      if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
        const timeToWait = this.REQUEST_INTERVAL - (now - this.lastRequestTime)
        console.log(`[Discogs API] Rate limit reached, waiting ${Math.ceil(timeToWait / 1000)}s`)
        await this.sleep(timeToWait)
        this.requestCount = 0
        this.lastRequestTime = Date.now()
      }

      const request = this.requestQueue.shift()
      if (request) {
        await request()
        this.requestCount++

        // Small delay between requests
        await this.sleep(200)
      }
    }

    this.isProcessing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getStatus() {
    return {
      requestCount: this.requestCount,
      maxRequestsPerMinute: this.MAX_REQUESTS_PER_MINUTE,
      queueLength: this.requestQueue.length
    }
  }
}

// Global rate limiter instance
const rateLimiter = new DiscogsRateLimiter()

/**
 * Get Discogs API headers with authentication
 */
function getDiscogsHeaders(): HeadersInit {
  const token = process.env.DISCOGS_API_TOKEN

  if (!token) {
    throw new Error('DISCOGS_API_TOKEN not configured')
  }

  return {
    'Authorization': `Discogs token=${token}`,
    'User-Agent': 'RhythmLabRadio/1.0 +https://rhythmlabradio.com',
    'Content-Type': 'application/json'
  }
}

/**
 * Search Discogs for an artist
 */
export async function searchDiscogsArtist(
  artistName: string,
  options: {
    maxResults?: number
    type?: 'artist' | 'release' | 'master' | 'label'
  } = {}
): Promise<DiscogsArtistResult | null> {
  const { maxResults = 1, type = 'artist' } = options

  try {
    const result = await rateLimiter.addToQueue(async () => {
      // Clean artist name more aggressively
      const cleanArtistName = artistName
        .replace(/["""''`''„""「」『』]/g, '') // Remove all quote types
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

      const searchQuery = encodeURIComponent(cleanArtistName)
      const url = `https://api.discogs.com/database/search?q=${searchQuery}&type=${type}&per_page=${maxResults}`

      console.log(`[Discogs API] Original artist: "${artistName}"`)
      console.log(`[Discogs API] Cleaned artist: "${cleanArtistName}"`)
      console.log(`[Discogs API] Searching for artist: "${cleanArtistName}"`)

      const response = await fetch(url, {
        headers: getDiscogsHeaders()
      })

      if (!response.ok) {
        const errorData: DiscogsApiError = await response.json()
        throw new Error(`Discogs API error (${response.status}): ${errorData.message}`)
      }

      return response.json() as Promise<DiscogsSearchResponse>
    })

    if (result.results && result.results.length > 0) {
      const artist = result.results[0]

      if (artist.type === 'artist') {
        // Fetch detailed artist information
        const artistDetails = await getDiscogsArtistDetails(artist.id)

        if (artistDetails) {
          const artistResult: DiscogsArtistResult = {
            artistId: artistDetails.id,
            name: artistDetails.name,
            realname: artistDetails.realname,
            profile: artistDetails.profile,
            imageUrl: artistDetails.images?.[0]?.uri150 || artist.thumb,
            discogsUrl: `https://www.discogs.com/artist/${artistDetails.id}`,
            genres: [], // Will be populated from releases if needed
            aliases: artistDetails.aliases?.map(alias => alias.name)
          }

          console.log(`[Discogs API] Found artist: ${artistResult.name}`)
          return artistResult
        }
      }
    }

    console.log(`[Discogs API] No artist found for: "${artistName}"`)
    return null

  } catch (error) {
    console.error('[Discogs API] Search error:', error)
    return null
  }
}

/**
 * Get detailed artist information from Discogs
 */
async function getDiscogsArtistDetails(artistId: number): Promise<DiscogsArtist | null> {
  try {
    const result = await rateLimiter.addToQueue(async () => {
      const url = `https://api.discogs.com/artists/${artistId}`

      const response = await fetch(url, {
        headers: getDiscogsHeaders()
      })

      if (!response.ok) {
        const errorData: DiscogsApiError = await response.json()
        throw new Error(`Discogs API error (${response.status}): ${errorData.message}`)
      }

      return response.json() as Promise<DiscogsArtist>
    })

    return result

  } catch (error) {
    console.error('[Discogs API] Artist details error:', error)
    return null
  }
}

/**
 * Get artist releases from Discogs
 */
export async function getDiscogsArtistReleases(
  artistId: number,
  options: {
    maxResults?: number
    sort?: 'year' | 'title' | 'format'
    order?: 'asc' | 'desc'
  } = {}
): Promise<DiscogsRelease[]> {
  const { maxResults = 10, sort = 'year', order = 'desc' } = options

  try {
    const result = await rateLimiter.addToQueue(async () => {
      const url = `https://api.discogs.com/artists/${artistId}/releases?per_page=${maxResults}&sort=${sort}&sort_order=${order}`

      console.log(`[Discogs API] Fetching releases for artist ID: ${artistId}`)

      const response = await fetch(url, {
        headers: getDiscogsHeaders()
      })

      if (!response.ok) {
        const errorData: DiscogsApiError = await response.json()
        throw new Error(`Discogs API error (${response.status}): ${errorData.message}`)
      }

      return response.json() as Promise<{ releases: DiscogsRelease[] }>
    })

    console.log(`[Discogs API] Found ${result.releases.length} releases`)
    return result.releases

  } catch (error) {
    console.error('[Discogs API] Releases error:', error)
    return []
  }
}

/**
 * Batch search Discogs artists for multiple tracks
 */
export async function batchSearchDiscogsArtists(
  artists: Array<{ artist: string; id?: string }>,
  onProgress?: (completed: number, total: number, currentArtist: string) => void
): Promise<Array<{
  trackId?: string
  artist: string
  discogsResult: DiscogsArtistResult | null
}>> {
  const results = []
  const processedArtists = new Set<string>()

  console.log(`[Discogs API] Starting batch search for ${artists.length} artists`)

  for (let i = 0; i < artists.length; i++) {
    const { artist, id } = artists[i]

    if (onProgress) {
      onProgress(i, artists.length, artist)
    }

    // Skip if we've already processed this artist
    const artistKey = artist.toLowerCase().trim()
    let discogsResult: DiscogsArtistResult | null = null

    if (!processedArtists.has(artistKey)) {
      discogsResult = await searchDiscogsArtist(artist)
      processedArtists.add(artistKey)
    }

    results.push({
      trackId: id,
      artist,
      discogsResult
    })

    // Log rate limit status periodically
    if ((i + 1) % 10 === 0) {
      const status = rateLimiter.getStatus()
      console.log(`[Discogs API] Status: ${status.requestCount}/${status.maxRequestsPerMinute} requests, queue: ${status.queueLength}`)
    }
  }

  if (onProgress) {
    onProgress(artists.length, artists.length, 'Completed')
  }

  const successCount = results.filter(r => r.discogsResult !== null).length
  const uniqueCount = processedArtists.size
  console.log(`[Discogs API] Batch search completed: ${successCount}/${uniqueCount} unique artists found`)

  return results
}

/**
 * Get current rate limit status
 */
export function getDiscogsRateLimitStatus() {
  return rateLimiter.getStatus()
}

/**
 * Clean and normalize artist name for better search results
 */
export function normalizeArtistName(artistName: string): string {
  return artistName
    .trim()
    // Remove common prefixes
    .replace(/^(The|A|An)\s+/i, '')
    // Remove featuring information
    .replace(/\s+(feat\.?|featuring|ft\.?|with)\s+.+$/i, '')
    // Remove remix information
    .replace(/\s+\(.*(remix|mix|edit).*\)$/i, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract genres from Discogs releases
 */
export async function getArtistGenres(artistId: number): Promise<string[]> {
  try {
    const releases = await getDiscogsArtistReleases(artistId, { maxResults: 5 })
    const genres = new Set<string>()

    releases.forEach(release => {
      release.genres?.forEach(genre => genres.add(genre))
      release.styles?.forEach(style => genres.add(style))
    })

    return Array.from(genres).slice(0, 5) // Limit to top 5 genres

  } catch (error) {
    console.error('[Discogs API] Genres error:', error)
    return []
  }
}