import { useEffect, useState, useCallback } from 'react'
import { searchClient, INDICES } from '@/lib/algolia/client'

interface LiveSong {
  objectID: string
  song: string
  artist: string
  release?: string
  label?: string
  episode_title?: string
  relative_time: string
  start_time: string
  spotify_track_id?: string
}

interface UseLiveSongsOptions {
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function useLiveSongs({
  limit = 10,
  autoRefresh = true,
  refreshInterval = 600000 // 10 minutes default
}: UseLiveSongsOptions = {}) {
  const [songs, setSongs] = useState<LiveSong[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchLiveSongs = useCallback(async () => {
    if (!searchClient) {
      setError('Search client not configured')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await searchClient.search([{
        indexName: INDICES.LIVE_SONGS,
        params: {
          query: '',
          hitsPerPage: limit,
          filters: 'is_recent:true',
          attributesToRetrieve: [
            'objectID',
            'song',
            'artist',
            'release',
            'label',
            'episode_title',
            'relative_time',
            'start_time',
            'spotify_track_id'
          ],
          // Sort by most recent first
          // Note: You'll need to configure this as a ranking criterion in Algolia dashboard
          // or use a virtual replica sorted by start_timestamp
        }
      }])

      const hits = response.results[0]?.hits || []
      setSongs(hits as LiveSong[])
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Failed to fetch live songs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch live songs')
    } finally {
      setLoading(false)
    }
  }, [limit])

  // Initial fetch
  useEffect(() => {
    fetchLiveSongs()
  }, [fetchLiveSongs])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLiveSongs()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchLiveSongs])

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchLiveSongs()
  }, [fetchLiveSongs])

  // Check if a song just started (within last 5 minutes)
  const getNewSongs = useCallback((since: Date) => {
    return songs.filter(song => {
      const songTime = new Date(song.start_time)
      return songTime > since
    })
  }, [songs])

  return {
    songs,
    loading,
    error,
    lastUpdated,
    refresh,
    getNewSongs
  }
}

// Hook for current playing song
export function useCurrentSong() {
  const { songs, loading, error, refresh } = useLiveSongs({
    limit: 1,
    autoRefresh: true,
    refreshInterval: 60000 // Check every minute for current song
  })

  return {
    currentSong: songs[0] || null,
    loading,
    error,
    refresh
  }
}

// Hook for recent playlist
export function useRecentPlaylist(limit = 20) {
  const { songs, loading, error, refresh, lastUpdated } = useLiveSongs({
    limit,
    autoRefresh: true,
    refreshInterval: 600000 // 10 minutes
  })

  return {
    playlist: songs,
    loading,
    error,
    refresh,
    lastUpdated
  }
}