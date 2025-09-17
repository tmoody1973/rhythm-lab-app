"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import type { Song } from "@/lib/database/types"

interface NowPlayingProps {
  className?: string
  showControls?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface LiveStreamStatus {
  is_live: boolean
  current_track_title?: string
  current_track_artist?: string
  current_show_title?: string
  listeners_count: number
  stream_url?: string
  updated_at: string
}

export function NowPlaying({
  className = "",
  showControls = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: NowPlayingProps) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [liveStream, setLiveStream] = useState<LiveStreamStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLiveData = async () => {
    try {
      setError(null)

      const response = await fetch('/api/live-stream')

      if (!response.ok) {
        throw new Error('Failed to fetch live data')
      }

      const data = await response.json()

      setLiveStream(data.liveStream)
      setCurrentSong(data.currentSong)
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Failed to fetch live data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const syncWithSpinnitron = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/spinitron/current', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to sync with Spinitron')
      }

      // Refresh data after sync
      await fetchLiveData()

    } catch (err) {
      console.error('Failed to sync with Spinitron:', err)
      setError(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  useEffect(() => {
    fetchLiveData()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchLiveData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  if (loading && !currentSong) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error && !currentSong) {
    return (
      <div className={`${className} text-red-600`}>
        <p className="text-sm">Failed to load now playing</p>
        {showControls && (
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLiveData}
            className="mt-2"
          >
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Use live stream data first, fallback to current song
  const displayTitle = liveStream?.current_track_title || currentSong?.song || 'No track info'
  const displayArtist = liveStream?.current_track_artist || currentSong?.artist || 'Unknown artist'
  const displayShow = liveStream?.current_show_title || currentSong?.episode_title || 'Live Show'
  const isLive = liveStream?.is_live ?? false
  const listenerCount = liveStream?.listeners_count || 0

  return (
    <div className={`${className}`}>
      <div className="space-y-2">
        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 font-medium">LIVE</span>
            {listenerCount > 0 && (
              <span className="text-gray-500">• {listenerCount} listeners</span>
            )}
          </div>
        )}

        {/* Show title */}
        <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
          {displayShow}
        </div>

        {/* Current track */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg leading-tight">
              {displayTitle}
            </h3>
            <p className="text-muted-foreground">
              {displayArtist}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <FavoriteButton
              track={{
                title: displayTitle,
                artist: displayArtist,
                album: currentSong?.release,
                image: currentSong?.image
              }}
              size="md"
            />
          </div>
        </div>

        {/* Additional track info */}
        {currentSong?.release && (
          <p className="text-sm text-gray-500">
            from "{currentSong.release}"
            {currentSong.label && ` on ${currentSong.label}`}
          </p>
        )}

        {/* Controls and status */}
        {showControls && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLiveData}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={syncWithSpinnitron}
                disabled={loading}
              >
                Sync
              </Button>
            </div>

            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}