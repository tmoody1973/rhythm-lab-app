"use client"

import { createContext, useContext, useState, useRef, ReactNode } from "react"

// Audio source types
export type AudioSource = 'live' | 'podcast'

export interface PodcastEpisode {
  id: string
  title: string
  audioUrl: string
  duration?: number
  description?: string
  imageUrl?: string
  publishedAt?: string
}

export interface LiveStreamInfo {
  streamUrl: string
  stationName: string
  currentSong?: {
    artist: string
    song: string
    release?: string
    label?: string
  }
}

interface UnifiedPlayerContextType {
  // Current source
  currentSource: AudioSource | null

  // Podcast state
  currentEpisode: PodcastEpisode | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number

  // Live stream state
  liveStreamInfo: LiveStreamInfo | null
  isLiveStreaming: boolean

  // Common audio controls
  volume: number
  isMuted: boolean

  // Actions
  playPodcast: (episode: PodcastEpisode) => void
  playLiveStream: (streamInfo: LiveStreamInfo) => void
  togglePlay: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  stop: () => void
}

const UnifiedPlayerContext = createContext<UnifiedPlayerContextType | undefined>(undefined)

export function UnifiedPlayerProvider({ children }: { children: ReactNode }) {
  // Source state
  const [currentSource, setCurrentSource] = useState<AudioSource | null>(null)

  // Podcast state
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Live stream state
  const [liveStreamInfo, setLiveStreamInfo] = useState<LiveStreamInfo | null>(null)
  const [isLiveStreaming, setIsLiveStreaming] = useState(false)

  // Common audio state
  const [volume, setVolumeState] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)

  // Audio refs
  const podcastAudioRef = useRef<HTMLAudioElement>(null)
  const liveStreamAudioRef = useRef<HTMLAudioElement>(null)

  const getCurrentAudioElement = () => {
    return currentSource === 'live' ? liveStreamAudioRef.current : podcastAudioRef.current
  }

  const stopAllAudio = () => {
    // Stop podcast
    if (podcastAudioRef.current) {
      podcastAudioRef.current.pause()
      podcastAudioRef.current.currentTime = 0
    }

    // Stop live stream
    if (liveStreamAudioRef.current) {
      liveStreamAudioRef.current.pause()
    }

    setIsPlaying(false)
    setIsLiveStreaming(false)
    setIsLoading(false)
  }

  const playPodcast = async (episode: PodcastEpisode) => {
    const audio = podcastAudioRef.current
    if (!audio) return

    try {
      // Stop any current audio
      stopAllAudio()

      // Switch to podcast mode
      setCurrentSource('podcast')
      setCurrentEpisode(episode)
      setLiveStreamInfo(null)

      // Load new episode if different
      if (currentEpisode?.id !== episode.id) {
        setCurrentTime(0)
        audio.src = episode.audioUrl
        audio.currentTime = 0
      }

      setIsLoading(true)
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Podcast playback failed:', error)
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const playLiveStream = async (streamInfo: LiveStreamInfo) => {
    const audio = liveStreamAudioRef.current
    if (!audio) return

    try {
      // Stop any current audio
      stopAllAudio()

      // Switch to live stream mode
      setCurrentSource('live')
      setLiveStreamInfo(streamInfo)
      setCurrentEpisode(null)

      // Set live stream URL
      audio.src = streamInfo.streamUrl

      setIsLoading(true)
      await audio.play()
      setIsLiveStreaming(true)
      setIsPlaying(true)
    } catch (error) {
      console.error('Live stream playback failed:', error)
      setIsPlaying(false)
      setIsLiveStreaming(false)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlay = async () => {
    const audio = getCurrentAudioElement()
    if (!audio || (!currentEpisode && !liveStreamInfo)) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        if (currentSource === 'live') {
          setIsLiveStreaming(false)
        }
      } else {
        setIsLoading(true)
        await audio.play()
        setIsPlaying(true)
        if (currentSource === 'live') {
          setIsLiveStreaming(true)
        }
      }
    } catch (error) {
      console.error('Playback failed:', error)
      setIsPlaying(false)
      if (currentSource === 'live') {
        setIsLiveStreaming(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const pause = () => {
    const audio = getCurrentAudioElement()
    if (!audio) return

    audio.pause()
    setIsPlaying(false)
    if (currentSource === 'live') {
      setIsLiveStreaming(false)
    }
  }

  const seek = (time: number) => {
    // Only allow seeking for podcasts, not live streams
    if (currentSource !== 'podcast') return

    const audio = podcastAudioRef.current
    if (!audio) return

    audio.currentTime = time
    setCurrentTime(time)
  }

  const setVolume = (newVolume: number) => {
    const audio = getCurrentAudioElement()
    if (!audio) return

    audio.volume = newVolume
    setVolumeState(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = getCurrentAudioElement()
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const stop = () => {
    stopAllAudio()
    setCurrentSource(null)
    setCurrentEpisode(null)
    setLiveStreamInfo(null)
    setCurrentTime(0)
  }

  // Podcast audio event handlers
  const handlePodcastTimeUpdate = () => {
    const audio = podcastAudioRef.current
    if (!audio || currentSource !== 'podcast') return
    setCurrentTime(audio.currentTime)
  }

  const handlePodcastLoadedMetadata = () => {
    const audio = podcastAudioRef.current
    if (!audio || currentSource !== 'podcast') return
    setDuration(audio.duration)
  }

  const handlePodcastEnded = () => {
    if (currentSource !== 'podcast') return
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleAudioLoadStart = () => setIsLoading(true)
  const handleAudioCanPlay = () => setIsLoading(false)
  const handleAudioError = (type: string) => {
    setIsLoading(false)
    setIsPlaying(false)
    if (type === 'live') {
      setIsLiveStreaming(false)
    }
    console.error(`${type} audio error occurred`)
  }

  return (
    <UnifiedPlayerContext.Provider
      value={{
        currentSource,
        currentEpisode,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        liveStreamInfo,
        isLiveStreaming,
        volume,
        isMuted,
        playPodcast,
        playLiveStream,
        togglePlay,
        pause,
        seek,
        setVolume,
        toggleMute,
        stop,
      }}
    >
      {children}

      {/* Hidden audio element for podcast playback */}
      <audio
        ref={podcastAudioRef}
        onTimeUpdate={handlePodcastTimeUpdate}
        onLoadedMetadata={handlePodcastLoadedMetadata}
        onEnded={handlePodcastEnded}
        onLoadStart={handleAudioLoadStart}
        onCanPlay={handleAudioCanPlay}
        onError={() => handleAudioError('podcast')}
        preload="metadata"
      />

      {/* Hidden audio element for live stream */}
      <audio
        ref={liveStreamAudioRef}
        onLoadStart={handleAudioLoadStart}
        onCanPlay={handleAudioCanPlay}
        onError={() => handleAudioError('live')}
        preload="none"
      />
    </UnifiedPlayerContext.Provider>
  )
}

export function useUnifiedPlayer() {
  const context = useContext(UnifiedPlayerContext)
  if (context === undefined) {
    throw new Error('useUnifiedPlayer must be used within a UnifiedPlayerProvider')
  }
  return context
}