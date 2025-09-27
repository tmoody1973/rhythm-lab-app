"use client"

import { createContext, useContext, useState, useRef, ReactNode } from "react"

interface PodcastEpisode {
  id: string
  title: string
  audioUrl: string
  duration?: number
  description?: string
  imageUrl?: string
  publishedAt?: string
}

interface PodcastContextType {
  currentEpisode: PodcastEpisode | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playEpisode: (episode: PodcastEpisode) => void
  togglePlay: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined)

export function PodcastProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const playEpisode = async (episode: PodcastEpisode) => {
    const audio = audioRef.current
    if (!audio) return

    // If playing a different episode, reset and load new one
    if (currentEpisode?.id !== episode.id) {
      setCurrentEpisode(episode)
      setCurrentTime(0)
      audio.src = episode.audioUrl
      audio.currentTime = 0
    }

    try {
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

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !currentEpisode) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Podcast playback failed:', error)
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const pause = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()
    setIsPlaying(false)
  }

  const seek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = time
    setCurrentTime(time)
  }

  const setVolume = (newVolume: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = newVolume
    setVolumeState(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  // Audio event handlers
  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleLoadStart = () => setIsLoading(true)
  const handleCanPlay = () => setIsLoading(false)
  const handleError = () => {
    setIsLoading(false)
    setIsPlaying(false)
    console.error('Audio error occurred')
  }

  return (
    <PodcastContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        playEpisode,
        togglePlay,
        pause,
        seek,
        setVolume,
        toggleMute,
      }}
    >
      {children}
      {/* Hidden audio element for podcast playback */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        preload="metadata"
      />
    </PodcastContext.Provider>
  )
}

export function usePodcast() {
  const context = useContext(PodcastContext)
  if (context === undefined) {
    throw new Error('usePodcast must be used within a PodcastProvider')
  }
  return context
}