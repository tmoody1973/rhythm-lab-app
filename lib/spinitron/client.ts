// Spinitron API client

import type {
  SpinitrondSpin,
  SpinitrondPlaylist,
  SpinitrondShow,
  SpinitrondApiResponse,
  SpinitrondConfig,
  TransformedSong
} from './types'

export class SpinitrondClient {
  private config: SpinitrondConfig

  constructor(config: SpinitrondConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://spinitron.com/api',
      timezone: config.timezone || 'UTC'
    }
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`)

    // Add default params
    url.searchParams.set('access-token', this.config.apiKey)

    // Add custom params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RhythmLabRadio/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Spinitron API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Spinitron API request failed:', error)
      throw error
    }
  }

  // Get current spin (currently playing song)
  async getCurrentSpin(): Promise<SpinitrondSpin | null> {
    try {
      const response = await this.request<SpinitrondApiResponse<SpinitrondSpin>>('/spins', {
        count: 1,
        start: new Date().toISOString()
      })

      return response.results[0] || null
    } catch (error) {
      console.error('Failed to fetch current spin:', error)
      return null
    }
  }

  // Get recent spins (song history)
  async getRecentSpins(count: number = 20, hours: number = 24): Promise<SpinitrondSpin[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      const response = await this.request<SpinitrondApiResponse<SpinitrondSpin>>('/spins', {
        count,
        since,
        order: '-start'
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to fetch recent spins:', error)
      return []
    }
  }

  // Get spins for a specific time range
  async getSpinsByTimeRange(start: Date, end: Date): Promise<SpinitrondSpin[]> {
    try {
      const response = await this.request<SpinitrondApiResponse<SpinitrondSpin>>('/spins', {
        start: start.toISOString(),
        end: end.toISOString(),
        order: '-start'
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to fetch spins by time range:', error)
      return []
    }
  }

  // Get current playlist
  async getCurrentPlaylist(): Promise<SpinitrondPlaylist | null> {
    try {
      const response = await this.request<SpinitrondApiResponse<SpinitrondPlaylist>>('/playlists', {
        count: 1,
        start: new Date().toISOString()
      })

      return response.results[0] || null
    } catch (error) {
      console.error('Failed to fetch current playlist:', error)
      return null
    }
  }

  // Get shows
  async getShows(count: number = 10): Promise<SpinitrondShow[]> {
    try {
      const response = await this.request<SpinitrondApiResponse<SpinitrondShow>>('/shows', {
        count
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to fetch shows:', error)
      return []
    }
  }

  // Transform Spinitron spin to our database format
  transformSpin(spin: SpinitrondSpin): TransformedSong {
    return {
      spinitron_id: spin.id,
      song: spin.song,
      artist: spin.artist,
      release: spin.release,
      label: spin.label,
      image: spin.image,
      start_time: spin.start,
      duration: spin.duration,
      episode_title: spin.episode_title,
      station_id: this.config.stationId,
      enhanced_metadata: {
        composer: spin.composer,
        year: spin.year,
        genre: spin.genre,
        disk_number: spin.disk_number,
        track_number: spin.track_number,
        note: spin.note,
        request: spin.request,
        new: spin.new,
        local: spin.local,
        playlist_id: spin.playlist_id,
        episode_id: spin.episode_id
      }
    }
  }

  // Get transformed spins ready for database insertion
  async getTransformedCurrentSpin(): Promise<TransformedSong | null> {
    const spin = await this.getCurrentSpin()
    return spin ? this.transformSpin(spin) : null
  }

  async getTransformedRecentSpins(count: number = 20, hours: number = 24): Promise<TransformedSong[]> {
    const spins = await this.getRecentSpins(count, hours)
    return spins.map(spin => this.transformSpin(spin))
  }
}

// Create singleton instance with environment variables
export function createSpinitrondClient(): SpinitrondClient | null {
  const apiKey = process.env.SPINITRON_API_KEY
  const stationId = process.env.SPINITRON_STATION_ID || 'rlr-main'

  if (!apiKey) {
    console.warn('SPINITRON_API_KEY not found in environment variables')
    return null
  }

  return new SpinitrondClient({
    apiKey,
    baseUrl: 'https://spinitron.com/api',
    stationId,
    timezone: 'America/New_York'
  })
}

// Export default client instance
export const spinitronClient = createSpinitrondClient()