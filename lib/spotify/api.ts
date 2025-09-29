/**
 * Spotify Web API Integration
 *
 * This handles all Spotify API interactions for track enhancement.
 * Uses Client Credentials flow (no user auth needed).
 *
 * IMPORTANT: Some features may require specific Spotify API permissions:
 * - Basic track search: Always works with Client Credentials
 * - Audio features: Requires Web API access (may get 403 if restricted)
 * - Recommendations: Requires Web API access (may get 404/403 if restricted)
 *
 * The system gracefully handles permission errors and continues without these features.
 */

interface SpotifyToken {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string; id: string }[]
  album: {
    name: string
    images: { url: string; width: number; height: number }[]
    release_date: string
  }
  popularity: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
  duration_ms: number
  explicit: boolean
}

interface SpotifyAudioFeatures {
  danceability: number
  energy: number
  tempo: number
  valence: number
  acousticness: number
  instrumentalness: number
}

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[]
    total: number
  }
}

interface SpotifyRecommendations {
  tracks: SpotifyTrack[]
}

// Cache for access tokens (in production, use Redis or database)
let tokenCache: SpotifyToken | null = null

/**
 * STEP 1: Authentication
 *
 * Spotify requires an access token for all requests.
 * We use "Client Credentials" flow which gives us app-level access.
 */
export async function getSpotifyAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires_at > Date.now()) {
    console.log('Using cached Spotify token')
    return tokenCache.access_token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured')
  }

  console.log('Fetching new Spotify access token...')

  // Create base64 encoded credentials (required by Spotify)
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`)
    }

    const data = await response.json()

    // Cache the token with expiration time
    tokenCache = {
      ...data,
      expires_at: Date.now() + (data.expires_in * 1000) - 60000 // Expire 1 minute early
    }

    console.log(`Spotify token obtained, expires in ${data.expires_in} seconds`)
    return data.access_token

  } catch (error) {
    console.error('Spotify authentication error:', error)
    throw error
  }
}

/**
 * STEP 2: Search for Tracks
 *
 * Takes artist + song name and finds matching Spotify tracks.
 * Returns the best match based on name similarity.
 */
export async function searchSpotifyTrack(artist: string, track: string): Promise<SpotifyTrack | null> {
  try {
    const accessToken = await getSpotifyAccessToken()

    // Create search query - Spotify works best with "artist track" format
    const query = `artist:"${artist}" track:"${track}"`
    console.log(`Searching Spotify for: ${query}`)

    const response = await fetch(
      `https://api.spotify.com/v1/search?` + new URLSearchParams({
        q: query,
        type: 'track',
        limit: '10', // Get multiple results to find best match
        market: 'US'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`)
    }

    const data: SpotifySearchResult = await response.json()

    if (data.tracks.items.length === 0) {
      console.log(`No Spotify results for: ${artist} - ${track}`)
      return null
    }

    // Find the best match by comparing artist and track names
    const bestMatch = findBestTrackMatch(data.tracks.items, artist, track)

    if (bestMatch) {
      console.log(`Found Spotify match: ${bestMatch.artists[0]?.name} - ${bestMatch.name} (popularity: ${bestMatch.popularity})`)
    }

    return bestMatch

  } catch (error) {
    console.error('Spotify search error:', error)
    return null
  }
}

/**
 * STEP 3: Get Audio Features
 *
 * Spotify provides detailed audio analysis (danceability, energy, etc.)
 * This adds rich metadata to tracks.
 */
export async function getSpotifyAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
  try {
    const accessToken = await getSpotifyAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/audio-features/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Audio features not available for track: ${trackId}`)
        return null
      }
      if (response.status === 403) {
        console.log(`Access denied for audio features (check API permissions): ${trackId}`)
        return null
      }
      console.warn(`Spotify audio features failed: ${response.status} - continuing without audio features`)
      return null
    }

    return await response.json()

  } catch (error) {
    console.error('Spotify audio features error:', error)
    return null
  }
}

/**
 * STEP 4: Get Similar Tracks
 *
 * Uses Spotify's recommendation engine to find similar tracks.
 * Great for music discovery!
 */
export async function getSpotifyRecommendations(trackId: string, limit: number = 5): Promise<SpotifyTrack[]> {
  try {
    const accessToken = await getSpotifyAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?` + new URLSearchParams({
        seed_tracks: trackId,
        limit: limit.toString(),
        market: 'US'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Recommendations not available for track: ${trackId}`)
        return []
      }
      if (response.status === 403) {
        console.log(`Access denied for recommendations (check API permissions): ${trackId}`)
        return []
      }
      console.warn(`Spotify recommendations failed: ${response.status} - continuing without recommendations`)
      return []
    }

    const data: SpotifyRecommendations = await response.json()
    console.log(`Found ${data.tracks.length} similar tracks for ${trackId}`)

    return data.tracks

  } catch (error) {
    console.error('Spotify recommendations error:', error)
    return []
  }
}

/**
 * HELPER: Find Best Track Match
 *
 * Compares search results to find the closest match to our track.
 * Uses fuzzy string matching to handle slight differences.
 */
function findBestTrackMatch(tracks: SpotifyTrack[], targetArtist: string, targetTrack: string): SpotifyTrack | null {
  if (tracks.length === 0) return null

  // Simple scoring based on name similarity
  const scores = tracks.map(track => {
    const artistMatch = track.artists.some(artist =>
      similarity(artist.name.toLowerCase(), targetArtist.toLowerCase()) > 0.7
    )
    const trackMatch = similarity(track.name.toLowerCase(), targetTrack.toLowerCase()) > 0.7

    // Prefer exact matches, then partial matches
    let score = 0
    if (artistMatch && trackMatch) score = 100
    else if (artistMatch || trackMatch) score = 50
    else score = 0

    // Boost score for popular tracks (they're more likely to be correct)
    score += track.popularity * 0.1

    return { track, score }
  })

  // Sort by score and return best match
  scores.sort((a, b) => b.score - a.score)

  return scores[0].score > 50 ? scores[0].track : null
}

/**
 * HELPER: String Similarity
 *
 * Simple algorithm to compare how similar two strings are.
 * Returns value between 0 (completely different) and 1 (identical).
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * HELPER: Levenshtein Distance
 *
 * Calculates the minimum number of edits needed to transform one string into another.
 * Used for fuzzy string matching.
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Get artist information from Spotify
 */
export async function getSpotifyArtist(artistId: string): Promise<any | null> {
  try {
    const accessToken = await getSpotifyAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Artist not found: ${artistId}`)
        return null
      }
      throw new Error(`Spotify artist lookup failed: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    console.error('Spotify artist lookup error:', error)
    return null
  }
}

/**
 * Get artist's albums from Spotify (includes collaborations)
 */
export async function getSpotifyArtistAlbums(
  artistId: string,
  options: {
    include_groups?: string[]
    market?: string
    limit?: number
    offset?: number
  } = {}
): Promise<any[]> {
  try {
    const accessToken = await getSpotifyAccessToken()

    const {
      include_groups = ['album', 'single', 'appears_on', 'compilation'],
      market = 'US',
      limit = 50,
      offset = 0
    } = options

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?` + new URLSearchParams({
        include_groups: include_groups.join(','),
        market,
        limit: limit.toString(),
        offset: offset.toString()
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify albums lookup failed: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []

  } catch (error) {
    console.error('Spotify artist albums error:', error)
    return []
  }
}

/**
 * Extract collaborations from Spotify track/album data
 */
export function extractSpotifyCollaborations(spotifyTrack: SpotifyTrack): Array<{
  artistName: string
  artistId: string
  type: 'main_artist' | 'featured_artist'
}> {
  const collaborations: Array<{
    artistName: string
    artistId: string
    type: 'main_artist' | 'featured_artist'
  }> = []

  // Main artists
  spotifyTrack.artists.forEach(artist => {
    collaborations.push({
      artistName: artist.name,
      artistId: artist.id,
      type: 'main_artist'
    })
  })

  // Check track name for featured artists (common pattern: "Song Title (feat. Artist)")
  const featRegex = /\((?:feat\.?|featuring|ft\.?|with)\s+([^)]+)\)/i
  const featMatch = spotifyTrack.name.match(featRegex)

  if (featMatch) {
    const featArtists = featMatch[1].split(/[,&]/).map(name => name.trim())
    featArtists.forEach(artistName => {
      if (artistName && !collaborations.some(c => c.artistName.toLowerCase() === artistName.toLowerCase())) {
        collaborations.push({
          artistName,
          artistId: '', // We don't have the Spotify ID from the track title
          type: 'featured_artist'
        })
      }
    })
  }

  return collaborations
}

/**
 * Get artist collaboration network from Spotify
 */
export async function getSpotifyArtistCollaborations(
  artistId: string,
  options: {
    maxAlbums?: number
    includeAppearances?: boolean
  } = {}
): Promise<{
  collaborators: Map<string, {
    artistName: string
    artistId: string
    collaborationType: 'main_artist' | 'featured_artist'
    trackCount: number
    tracks: Array<{
      trackName: string
      trackId: string
      albumName: string
      releaseDate?: string
    }>
  }>
}> {
  const { maxAlbums = 50, includeAppearances = true } = options

  try {
    console.log(`[Spotify Collaboration] Building network for artist ${artistId}`)

    // Get all albums including appearances
    const includeGroups = includeAppearances
      ? ['album', 'single', 'appears_on', 'compilation']
      : ['album', 'single']

    const albums = await getSpotifyArtistAlbums(artistId, {
      include_groups: includeGroups,
      limit: maxAlbums
    })

    const collaborators = new Map()

    // Process each album to extract tracks and collaborations
    for (const album of albums) {
      try {
        const accessToken = await getSpotifyAccessToken()

        // Get album tracks
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )

        if (!tracksResponse.ok) continue

        const tracksData = await tracksResponse.json()

        for (const track of tracksData.items || []) {
          const collaborations = extractSpotifyCollaborations(track)

          collaborations.forEach(collab => {
            // Skip the main artist we're analyzing
            if (collab.artistId === artistId) return

            const key = collab.artistName.toLowerCase()

            if (collaborators.has(key)) {
              const existing = collaborators.get(key)
              existing.trackCount++
              existing.tracks.push({
                trackName: track.name,
                trackId: track.id,
                albumName: album.name,
                releaseDate: album.release_date
              })
            } else {
              collaborators.set(key, {
                artistName: collab.artistName,
                artistId: collab.artistId,
                collaborationType: collab.type,
                trackCount: 1,
                tracks: [{
                  trackName: track.name,
                  trackId: track.id,
                  albumName: album.name,
                  releaseDate: album.release_date
                }]
              })
            }
          })
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.warn(`[Spotify Collaboration] Error processing album ${album.id}:`, error)
        continue
      }
    }

    console.log(`[Spotify Collaboration] Found ${collaborators.size} collaborators`)
    return { collaborators }

  } catch (error) {
    console.error('[Spotify Collaboration] Error building network:', error)
    return { collaborators: new Map() }
  }
}

/**
 * Search for an artist and get their Spotify ID
 */
export async function searchSpotifyArtist(artistName: string): Promise<{
  id: string
  name: string
  popularity: number
  genres: string[]
  followers: number
  images: Array<{ url: string; width: number; height: number }>
  external_urls: { spotify: string }
} | null> {
  try {
    const accessToken = await getSpotifyAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/search?` + new URLSearchParams({
        q: artistName,
        type: 'artist',
        limit: '1'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify artist search failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.artists?.items?.length > 0) {
      const artist = data.artists.items[0]
      return {
        id: artist.id,
        name: artist.name,
        popularity: artist.popularity,
        genres: artist.genres || [],
        followers: artist.followers?.total || 0,
        images: artist.images || [],
        external_urls: artist.external_urls
      }
    }

    return null

  } catch (error) {
    console.error('Spotify artist search error:', error)
    return null
  }
}

/**
 * Get related artists from Spotify (artists with similar style/audience)
 */
export async function getSpotifyRelatedArtists(artistId: string): Promise<Array<{
  id: string
  name: string
  popularity: number
  genres: string[]
}>> {
  try {
    const accessToken = await getSpotifyAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Related artists not found for: ${artistId}`)
        return []
      }
      throw new Error(`Spotify related artists failed: ${response.status}`)
    }

    const data = await response.json()

    return (data.artists || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity,
      genres: artist.genres || []
    }))

  } catch (error) {
    console.error('Spotify related artists error:', error)
    return []
  }
}

/**
 * MAIN: Get Enhanced Track Data
 *
 * This is the main function that combines all Spotify features.
 * Call this from your API routes.
 */
export async function getSpotifyTrackData(artist: string, track: string) {
  console.log(`Getting Spotify data for: ${artist} - ${track}`)

  // Step 1: Find the track
  const spotifyTrack = await searchSpotifyTrack(artist, track)
  if (!spotifyTrack) {
    return null
  }

  // Step 2: Get additional data in parallel (faster!)
  const [audioFeatures, recommendations] = await Promise.all([
    getSpotifyAudioFeatures(spotifyTrack.id),
    getSpotifyRecommendations(spotifyTrack.id, 3)
  ])

  return {
    track: spotifyTrack,
    audioFeatures,
    recommendations,
    // Add some computed fields for easier use
    hasPreview: !!spotifyTrack.preview_url,
    popularityLevel:
      spotifyTrack.popularity >= 80 ? 'Very Popular' :
      spotifyTrack.popularity >= 60 ? 'Popular' :
      spotifyTrack.popularity >= 40 ? 'Moderately Popular' :
      spotifyTrack.popularity >= 20 ? 'Niche' : 'Underground',
    albumArt: spotifyTrack.album.images[0]?.url || null
  }
}