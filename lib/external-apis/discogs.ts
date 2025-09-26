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
  type?: 'master' | 'release'  // This field comes from the artist releases endpoint
  main_release?: number  // Present for master releases
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

interface DiscogsDetailedRelease extends DiscogsRelease {
  master_id?: number
  master_url?: string
  type?: 'master' | 'release'
  status: string
  released?: string
  released_formatted?: string
  country?: string
  notes?: string
  data_quality?: string
  images?: Array<{
    type: 'primary' | 'secondary'
    uri: string
    resource_url: string
    uri150: string
    width: number
    height: number
  }>
}

interface StoryblokReleaseItem {
  component: 'release_item'
  _uid: string
  title: string
  year: number
  type: 'master' | 'release' | 'appearance' | 'track'
  label: string
  catalog_no: string
  cover_image_url: string
  discogs_release_id: number
  discogs_master_id?: number
  discogs_url: string
  formats: string[]
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
  const { maxResults = 5, type = 'artist' } = options // Increased to get more candidates

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
      // Filter to only artist results and find the best match
      const artistResults = result.results.filter(r => r.type === 'artist')

      if (artistResults.length === 0) {
        console.log(`[Discogs API] No artist results found for: "${artistName}"`)
        return null
      }

      console.log(`[Discogs API] Found ${artistResults.length} artist candidates:`)
      artistResults.forEach((artist, index) => {
        console.log(`  ${index + 1}. ${artist.title} (ID: ${artist.id})`)
      })

      // Find the best matching artist
      const bestMatch = findBestArtistMatch(artistName, artistResults)

      if (bestMatch) {
        console.log(`[Discogs API] Selected best match: ${bestMatch.title} (ID: ${bestMatch.id})`)

        // Fetch detailed artist information
        const artistDetails = await getDiscogsArtistDetails(bestMatch.id)

        if (artistDetails) {
          const artistResult: DiscogsArtistResult = {
            artistId: artistDetails.id,
            name: artistDetails.name,
            realname: artistDetails.realname,
            profile: artistDetails.profile,
            imageUrl: artistDetails.images?.[0]?.uri150 || bestMatch.thumb,
            discogsUrl: `https://www.discogs.com/artist/${artistDetails.id}`,
            genres: [], // Will be populated from releases if needed
            aliases: artistDetails.aliases?.map(alias => alias.name)
          }

          console.log(`[Discogs API] Found artist: ${artistResult.name} (ID: ${artistResult.artistId})`)
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
 * Find the best matching artist from search results
 */
function findBestArtistMatch(searchTerm: string, candidates: any[]): any | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const cleanSearchTerm = searchTerm.toLowerCase().trim()

  // Score each candidate
  const scoredCandidates = candidates.map(candidate => {
    const candidateName = candidate.title.toLowerCase().trim()
    let score = 0

    // Exact match gets highest score
    if (candidateName === cleanSearchTerm) {
      score += 100
    }
    // Check if search term is contained in candidate name
    else if (candidateName.includes(cleanSearchTerm)) {
      score += 50
    }
    // Check if candidate name is contained in search term
    else if (cleanSearchTerm.includes(candidateName)) {
      score += 30
    }

    // Prefer shorter names (less likely to be compilation artists)
    if (candidateName.length <= cleanSearchTerm.length + 5) {
      score += 10
    }

    // Prefer artists with images (usually main artists)
    if (candidate.thumb) {
      score += 5
    }

    console.log(`[Discogs API] Scoring "${candidate.title}": ${score} points`)

    return { candidate, score }
  })

  // Sort by score (highest first)
  scoredCandidates.sort((a, b) => b.score - a.score)

  return scoredCandidates[0].candidate
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

/**
 * Get detailed release information from Discogs
 */
export async function getDiscogsReleaseDetails(
  releaseId: number,
  type?: 'release' | 'master'
): Promise<DiscogsDetailedRelease | null> {
  try {
    const result = await rateLimiter.addToQueue(async () => {
      // Use appropriate endpoint based on type
      const endpoint = type === 'master' ? 'masters' : 'releases'
      const url = `https://api.discogs.com/${endpoint}/${releaseId}`

      console.log(`[Discogs API] Fetching ${type || 'release'} details for ID: ${releaseId}`)

      const response = await fetch(url, {
        headers: getDiscogsHeaders()
      })

      if (!response.ok) {
        const errorData: DiscogsApiError = await response.json()
        throw new Error(`Discogs API error (${response.status}): ${errorData.message}`)
      }

      return response.json() as Promise<DiscogsDetailedRelease>
    })

    return result

  } catch (error) {
    console.error('[Discogs API] Release details error:', error)
    return null
  }
}

/**
 * Get artist discography with detailed release information
 */
export async function getArtistDiscography(
  artistId: number,
  options: {
    maxResults?: number
    sort?: 'year' | 'title' | 'format'
    order?: 'asc' | 'desc'
    includeDetails?: boolean
  } = {}
): Promise<StoryblokReleaseItem[]> {
  const { maxResults = 20, sort = 'year', order = 'desc', includeDetails = true } = options

  try {
    console.log(`[Discogs API] Fetching discography for artist ID: ${artistId}`)

    // Get artist releases with a higher limit to allow for filtering
    const releases = await getDiscogsArtistReleases(artistId, { maxResults: maxResults * 3, sort, order })
    const discographyItems: StoryblokReleaseItem[] = []

    // Define formats we want to include (albums, singles, EPs)
    const allowedFormats = new Set([
      'album', 'lp', 'vinyl', 'cd', '12"', '7"', 'single', 'ep', 'maxi-single'
    ])

    // Process each release
    console.log(`[Discography Filter] Processing ${releases.length} releases for filtering...`)

    for (let i = 0; i < releases.length && discographyItems.length < maxResults; i++) {
      const release = releases[i]
      let detailedRelease: DiscogsDetailedRelease | null = null

      // Optionally fetch detailed information
      if (includeDetails) {
        detailedRelease = await getDiscogsReleaseDetails(release.id, release.type as 'release' | 'master')
        console.log(`[Discography Filter] Fetched details for "${release.title}": ${detailedRelease ? 'success' : 'failed'}`)
      }

      // Check if this release should be included based on format
      const releaseToCheck = detailedRelease || release
      const formats = releaseToCheck.formats?.map(f => f.name?.toLowerCase() || '') || []

      // More lenient format checking - include if ANY format info suggests it's a main release
      const hasAllowedFormat = formats.length === 0 || // Include releases with no format info
        formats.some(format =>
          allowedFormats.has(format) ||
          format.includes('album') ||
          format.includes('single') ||
          format.includes('ep') ||
          format.includes('lp') ||
          format.includes('vinyl') ||
          format.includes('cd')
        )

      // Skip compilations, bootlegs, and other unwanted types
      const title = releaseToCheck.title?.toLowerCase() || ''
      const isCompilation = title.includes('compilation') || title.includes('best of') || title.includes('greatest hits')
      const isBootleg = title.includes('bootleg') || title.includes('unofficial')
      const isRemix = title.includes('remix') && !title.includes('remixes')  // Skip single remixes but allow remix albums

      // Skip very obvious non-album releases
      const isObviousSingle = title.includes(' / ') || title.includes(' b/w ')  // likely single with B-side

      // DEBUG: Log only problematic cases
      if (!hasAllowedFormat || isCompilation || isBootleg || isRemix || isObviousSingle) {
        console.log(`[Discography Filter] SKIPPING "${releaseToCheck.title}": formats=[${formats.join(', ')}], comp=${isCompilation}, bootleg=${isBootleg}, remix=${isRemix}, single=${isObviousSingle}`)
      }

      if (hasAllowedFormat && !isCompilation && !isBootleg && !isRemix && !isObviousSingle) {
        // Create Storyblok release item
        const releaseItem = transformToStoryblokReleaseItem(releaseToCheck)
        if (releaseItem) {
          discographyItems.push(releaseItem)
          console.log(`  ✓ Added to discography (${discographyItems.length}/${maxResults})`)
        } else {
          console.log(`  ✗ Failed to transform to StoryblokReleaseItem`)
        }
      } else {
        console.log(`  ✗ Filtered out`)
      }

      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`[Discogs API] Processed ${i + 1}/${releases.length} releases, found ${discographyItems.length} albums/singles/EPs`)
      }
    }

    console.log(`[Discogs API] Discography completed: ${discographyItems.length} albums/singles/EPs from ${releases.length} total releases`)
    return discographyItems

  } catch (error) {
    console.error('[Discogs API] Discography error:', error)
    return []
  }
}

/**
 * Extract Discogs artist ID from URL
 */
function extractArtistIdFromUrl(discogsUrl: string): number | null {
  try {
    // Handle various Discogs URL formats:
    // https://www.discogs.com/artist/123456-Artist-Name
    // https://discogs.com/artist/123456-Artist-Name
    // /artist/123456-Artist-Name
    const match = discogsUrl.match(/\/artist\/(\d+)(?:-|$)/)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    return null
  } catch (error) {
    console.error('[Discogs URL Parser] Error parsing URL:', error)
    return null
  }
}

/**
 * Transform Discogs release to Storyblok release_item block
 */
function transformToStoryblokReleaseItem(release: DiscogsRelease | DiscogsDetailedRelease): StoryblokReleaseItem | null {
  try {
    // Generate unique ID for Storyblok block
    const uid = `release_${release.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Determine release type
    // Check multiple indicators for master releases
    let releaseType: 'master' | 'release' | 'appearance' | 'track' = 'release'

    // Check if it's explicitly marked as master
    if ('type' in release && release.type === 'master') {
      releaseType = 'master'
    }
    // Check if it has main_release field (masters have this)
    else if ('main_release' in release && release.main_release) {
      releaseType = 'master'
    }
    // Check if the resource_url indicates it's a master
    else if ('resource_url' in release && release.resource_url && release.resource_url.includes('/masters/')) {
      releaseType = 'master'
    }

    console.log(`[Release Type Detection] "${release.title}": type=${releaseType}, has main_release=${'main_release' in release}, type field=${release.type || 'none'}`)

    // Get label and catalog info with improved fallback logic
    const primaryLabel = release.labels?.[0]

    // Try multiple strategies to get a valid label name
    let label = 'Unknown Label'
    let catalogNo = ''

    if (primaryLabel) {
      // First try the name field
      if (primaryLabel.name && primaryLabel.name.trim()) {
        label = primaryLabel.name.trim()
        catalogNo = primaryLabel.catno || ''
      } else if (release.labels && release.labels.length > 0) {
        // Try to find any label with a valid name
        for (const labelItem of release.labels) {
          if (labelItem.name && labelItem.name.trim()) {
            label = labelItem.name.trim()
            catalogNo = labelItem.catno || ''
            break
          }
        }
      }
    }

    // Enhanced debug logging for label extraction
    if (label === 'Unknown Label' && release.labels?.length) {
      console.log(`[Label Debug] Release "${release.title}": Failed to extract label name from:`, {
        labelsCount: release.labels.length,
        firstLabel: release.labels[0],
        allLabels: release.labels.map(l => ({ name: l.name, catno: l.catno }))
      })
    } else if (!release.labels?.length) {
      console.log(`[Label Debug] Release "${release.title}": no labels array`)
    } else {
      console.log(`[Label Debug] Release "${release.title}": Successfully extracted label "${label}"`)
    }

    // Get formats
    const formats = release.formats?.map(format => {
      const formatName = format.name || 'Unknown'
      const descriptions = format.descriptions?.join(', ') || ''
      return descriptions ? `${formatName} (${descriptions})` : formatName
    }) || []

    // Get cover image
    let coverImageUrl = release.cover_image || release.thumb || ''
    if ('images' in release && release.images?.length) {
      coverImageUrl = release.images[0]?.uri || coverImageUrl
    }

    // Create URLs - use master or release depending on type
    const discogsUrl = releaseType === 'master'
      ? `https://www.discogs.com/master/${release.id}`
      : `https://www.discogs.com/release/${release.id}`

    return {
      component: 'release_item',
      _uid: uid,
      title: release.title,
      year: release.year || 0,
      type: releaseType,
      label,
      catalog_no: catalogNo,
      cover_image_url: coverImageUrl,
      // Put the ID in the correct field based on the release type
      discogs_release_id: releaseType === 'master' ? undefined : release.id,
      discogs_master_id: releaseType === 'master' ? release.id : (('master_id' in release) ? release.master_id : undefined),
      discogs_url: discogsUrl,
      formats
    }

  } catch (error) {
    console.error('[Discogs API] Transform error:', error)
    return null
  }
}

/**
 * Search for multiple artists on Discogs for user selection
 */
export async function searchDiscogsArtists(
  query: string,
  limit: number = 10
): Promise<Array<{
  id: number
  name: string
  profile?: string
  images?: Array<{ type: string; uri: string }>
  resource_url: string
  uri: string
}> | null> {
  try {
    const result = await rateLimiter.addToQueue(async () => {
      const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=artist&per_page=${limit}`

      console.log(`[Discogs API] Searching artists: ${url}`)

      const response = await fetch(url, {
        headers: getDiscogsHeaders()
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      return data.results || []
    })

    if (!result || result.length === 0) {
      console.log('[Discogs API] No artists found')
      return []
    }

    console.log(`[Discogs API] Found ${result.length} artists`)

    return result.map((artist: any) => ({
      id: artist.id,
      name: artist.title, // Discogs search uses 'title' field for name
      profile: artist.profile || '',
      images: artist.images || [],
      resource_url: artist.resource_url,
      uri: artist.uri
    }))

  } catch (error) {
    console.error('[Discogs API] Artists search error:', error)
    return null
  }
}

/**
 * Get artist discography and format for Storyblok artist profile
 */
export async function getArtistDiscographyByIdForProfile(
  artistId: number,
  options: {
    maxReleases?: number
    includeDetails?: boolean
  } = {}
): Promise<{
  success: boolean
  releases: StoryblokReleaseItem[]
  artistInfo: DiscogsArtistResult | null
  error?: string
}> {
  const { maxReleases = 15, includeDetails = true } = options

  try {
    console.log(`[Discogs API] Getting discography for artist ID: ${artistId}`)

    // Get the artist info directly by ID
    let artistInfo: DiscogsArtistResult | null = null
    try {
      const result = await rateLimiter.addToQueue(async () => {
        const url = `https://api.discogs.com/artists/${artistId}`
        const response = await fetch(url, {
          headers: getDiscogsHeaders()
        })

        if (!response.ok) {
          throw new Error(`Artist fetch failed: ${response.status}`)
        }

        return response.json()
      })

      artistInfo = {
        id: result.id,
        name: result.name,
        resource_url: result.resource_url,
        uri: result.uri,
        // Additional fields from direct artist fetch
        profile: result.profile,
        data_quality: result.data_quality,
        namevariations: result.namevariations || [],
        aliases: result.aliases || [],
        urls: result.urls || [],
        images: result.images || []
      }

      console.log(`[Discogs API] Found artist: ${artistInfo.name}`)
    } catch (error) {
      console.warn(`[Discogs API] Could not fetch artist info for ID ${artistId}:`, error)
      // Continue with discography fetch even if artist info fails
    }

    // Get artist releases
    const releases = await getArtistReleases(artistId, {
      maxResults: maxReleases * 3, // Get more to filter down
      includeDetails
    })

    if (releases.length === 0) {
      return {
        success: false,
        releases: [],
        artistInfo,
        error: `No releases found for artist ID ${artistId}`
      }
    }

    console.log(`[Discogs API] Successfully fetched ${releases.length} releases`)

    return {
      success: true,
      releases: releases.slice(0, maxReleases),
      artistInfo,
      error: undefined
    }

  } catch (error) {
    console.error('[Discogs API] Discography by ID error:', error)
    return {
      success: false,
      releases: [],
      artistInfo: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function getArtistDiscographyForProfile(
  artistName: string,
  options: {
    maxReleases?: number
    includeDetails?: boolean
    discogsUrl?: string  // New optional parameter
    discogsId?: string   // New optional parameter
  } = {}
): Promise<{
  success: boolean
  releases: StoryblokReleaseItem[]
  artistInfo: DiscogsArtistResult | null
  error?: string
}> {
  const { maxReleases = 15, includeDetails = true, discogsUrl, discogsId } = options

  try {
    // Priority 1: Use discogsId if provided
    if (discogsId) {
      const artistIdNum = parseInt(discogsId.toString(), 10)
      if (!isNaN(artistIdNum)) {
        console.log(`[Discogs API] Getting discography using provided ID: ${artistIdNum}`)
        return await getArtistDiscographyByIdForProfile(artistIdNum, { maxReleases, includeDetails })
      } else {
        console.warn(`[Discogs API] Invalid discogs_id provided: ${discogsId}`)
      }
    }

    // Priority 2: If we have a Discogs URL, extract the artist ID and use direct fetch
    if (discogsUrl) {
      console.log(`[Discogs API] Getting discography using URL: ${discogsUrl}`)

      const artistId = extractArtistIdFromUrl(discogsUrl)
      if (artistId) {
        console.log(`[Discogs API] Extracted artist ID: ${artistId}`)
        return await getArtistDiscographyByIdForProfile(artistId, { maxReleases, includeDetails })
      } else {
        console.warn(`[Discogs API] Could not extract artist ID from URL: ${discogsUrl}`)
        // Fall back to name search
      }
    }

    console.log(`[Discogs API] Getting discography by searching for: ${artistName}`)

    // First, find the artist
    const artistInfo = await searchDiscogsArtist(artistName)
    if (!artistInfo) {
      return {
        success: false,
        releases: [],
        artistInfo: null,
        error: `Artist "${artistName}" not found on Discogs`
      }
    }

    // Get the discography
    const releases = await getArtistDiscography(artistInfo.artistId, {
      maxResults: maxReleases,
      includeDetails
    })

    return {
      success: true,
      releases,
      artistInfo
    }

  } catch (error) {
    console.error('[Discogs API] Profile discography error:', error)
    return {
      success: false,
      releases: [],
      artistInfo: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}