"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NowPlaying } from "@/components/now-playing"
import { useRadio } from "@/lib/radio/context"
import type { Song } from "@/lib/database/types"

interface LiveStreamStatus {
  is_live: boolean
  current_track_title?: string
  current_track_artist?: string
  current_show_title?: string
  listeners_count: number
  stream_url?: string
  updated_at: string
}

export function LiveStreamSection() {
  const { currentSong, isLive, isLoading: radioLoading } = useRadio()
  const [recentSongs, setRecentSongs] = useState<Song[]>([])
  const [liveStream, setLiveStream] = useState<LiveStreamStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [songChangeAnimation, setSongChangeAnimation] = useState(false)

  useEffect(() => {
    const fetchRecentTracks = async (isRefresh = false) => {
      try {
        // Show updating indicator for refreshes (not initial load)
        if (isRefresh && !loading) {
          setIsUpdating(true)
        }

        // Use the edge function for recent tracks data
        const edgeFunctionUrl = 'https://iqzecpfmmsjooxuzvdgu.supabase.co/functions/v1/spinitron-proxy'
        const headers = {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }

        // Get recent songs from edge function (force fresh data for live updates)
        const response = await fetch(`${edgeFunctionUrl}?endpoint=spins&count=10&use_cache=false`, { headers })

        if (response.ok) {
          const data = await response.json()
          const songs = data.items || []

          if (songs.length > 0) {
            // Set recent songs (skip current song, get rest of the list)
            const recentTracks = songs.slice(1).map(track => ({
              id: track.id,
              song: track.song,
              artist: track.artist,
              release: track.release,
              label: track.label,
              image: track.image,
              start_time: track.start,
              duration: track.duration,
              episode_title: track.episode?.title,
              station_id: 'rlr-main'
            }))

            // Only update recent songs if the list has actually changed
            setRecentSongs(prev => {
              const prevIds = prev.map(s => s.id).join(',')
              const newIds = recentTracks.map(s => s.id).join(',')
              return prevIds !== newIds ? recentTracks : prev
            })

            // Check for song changes to trigger animation
            if (currentSong && songs[0] && currentSong.id !== songs[0].id) {
              setSongChangeAnimation(true)
              setTimeout(() => setSongChangeAnimation(false), 1500)
            }

            // Set live stream status (if we have current data, we're live)
            setLiveStream({
              is_live: isLive,
              current_track_title: currentSong?.song || songs[0]?.song,
              current_track_artist: currentSong?.artist || songs[0]?.artist,
              current_show_title: currentSong?.episode_title || songs[0]?.episode?.title || 'Rhythm Lab Radio',
              listeners_count: 42, // Default value
              stream_url: 'https://spinitron.com/radio/rhythm-lab-radio',
              updated_at: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent tracks:', error)
      } finally {
        setLoading(false)
        setIsUpdating(false)
      }
    }

    // Initial load
    fetchRecentTracks()

    // Auto-refresh every 15 seconds (faster updates!)
    const interval = setInterval(() => fetchRecentTracks(true), 15000)
    return () => clearInterval(interval)
  }, [currentSong, isLive])
  return (
    <div className="space-y-6">
      {/* Section Heading */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">RHYTHM LAB 24/7</h2>
          {isLive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-500">Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 py-2">
      <div className={`bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-0 overflow-hidden ${songChangeAnimation ? 'ring-2 ring-blue-500/50 ring-opacity-75' : ''}`}>
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
          {/* Background overlay for smooth color transitions */}
          <div className={`absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60 transition-all duration-2000 ${songChangeAnimation ? 'from-blue-900/40 to-purple-900/40' : ''}`} />

          {/* Main album artwork with crossfade effect */}
          <div className="relative w-full h-full">
            <img
              src={currentSong?.image || "/abstract-music-visualization-dark.jpg"}
              alt="Current show"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1500 ease-in-out transform ${songChangeAnimation ? 'scale-105 opacity-90' : 'scale-100 opacity-100'}`}
              key={currentSong?.id}
            />

            {/* Subtle animation overlay */}
            {songChangeAnimation && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse opacity-50" />
            )}
          </div>

          {/* Live badge with enhanced animation */}
          <div className="absolute top-4 left-4">
            <Badge className={`${liveStream?.is_live ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} text-white text-sm font-medium uppercase tracking-widest px-3 py-1 transition-all duration-300 ${songChangeAnimation ? 'scale-110' : 'scale-100'}`}>
              {liveStream?.is_live ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>

          {/* Enhanced metadata overlay with smooth animations */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className={`bg-black/50 backdrop-blur-sm p-3 rounded-lg transition-all duration-1000 ${songChangeAnimation ? 'bg-black/70 scale-102' : 'bg-black/50 scale-100'}`}>
              <h2 className={`text-lg md:text-xl font-bold tracking-tight leading-tight text-balance text-white mb-1 transition-all duration-1000 ${songChangeAnimation ? 'text-blue-100 transform translate-y-1' : 'text-white transform translate-y-0'}`}>
                {loading ? 'LOADING...' : `${currentSong?.artist?.toUpperCase() || 'UNKNOWN ARTIST'} - ${currentSong?.song?.toUpperCase() || 'UNKNOWN TRACK'}`}
              </h2>
              <p className={`text-xs font-medium uppercase tracking-wide transition-all duration-1000 ${songChangeAnimation ? 'text-blue-200/90' : 'text-white/80'}`}>
                NOW PLAYING FROM {currentSong?.episode_title?.toUpperCase() || liveStream?.current_show_title?.toUpperCase() || 'RHYTHM LAB RADIO'}
              </p>
            </div>
          </div>

          {/* New song notification flash */}
          {songChangeAnimation && (
            <div className="absolute top-4 right-4">
              <div className="bg-blue-500/80 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                NEW TRACK
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">TRACK DETAILS</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="text-sm">▶️</span>
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                  <span className="text-sm">🔊</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted border-2 border-border/50 overflow-hidden flex-shrink-0 rounded">
                <img
                  src={currentSong?.image || "/deep-house-album-cover-kerri-chandler-rain.jpg"}
                  alt="Album artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{currentSong?.artist?.toUpperCase() || 'UNKNOWN ARTIST'}</h3>
                <p className="text-base font-medium text-foreground/90 truncate">{currentSong?.song || 'Unknown Track'}</p>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground truncate">
                  {currentSong?.release ? `${currentSong.release}${currentSong.label ? ` • ${currentSong.label}` : ''}` : 'RHYTHM LAB RADIO'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">RECENT TRACKS</h3>
          {isUpdating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>UPDATING</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b-2 border-border/30">
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-12 ml-4 animate-pulse"></div>
              </div>
            ))
          ) : recentSongs.slice(0, 4).map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-3 py-3 border-b-2 border-border/30 hover:bg-muted/30 cursor-pointer transition-all duration-500 ease-in-out transform opacity-100 animate-in slide-in-from-top-2"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Album Artwork */}
              <div className="w-12 h-12 bg-muted border border-border/50 overflow-hidden rounded flex-shrink-0">
                <img
                  src={track.image || "/abstract-music-visualization-dark.jpg"}
                  alt="Album artwork"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate transition-all duration-300">{track.artist.toUpperCase()}</p>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground truncate transition-all duration-300">
                  {track.song.toUpperCase()}
                </p>
              </div>

              {/* Time */}
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground transition-all duration-300">
                {new Date(track.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border-2 border-border/50 transition-all duration-300 hover:border-foreground/30 hover:shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-widest text-foreground mb-4">CURRENT SHOW</h3>
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-lg mb-1">
              {liveStream?.current_show_title || currentSong?.episode_title || 'Rhythm Lab Radio'}
            </h4>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
              LIVE RADIO STREAM
            </p>
          </div>
          <p className="text-base leading-relaxed text-foreground/90">
            {liveStream?.is_live
              ? 'Live electronic music featuring deep house, ambient, jazz fusion, and experimental sounds from around the world.'
              : 'Currently offline. Check back soon for live music programming.'
            }
          </p>
          <div className="flex justify-between pt-2 border-t-2 border-border/30">
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {liveStream?.is_live ? '🔴 LIVE' : '⭕ OFFLINE'}
            </span>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              👥 {liveStream?.listeners_count || 0} LISTENERS
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
