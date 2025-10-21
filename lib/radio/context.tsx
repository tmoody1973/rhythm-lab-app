"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import type { Song } from "@/lib/database/types"

interface RadioContextType {
  currentSong: Song | null
  isLive: boolean
  isLoading: boolean
  isPlaying: boolean
  volume: number
  togglePlayPause: () => void
  setVolume: (volume: number) => void
}

const RadioContext = createContext<RadioContextType | undefined>(undefined)

export function RadioProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(50)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const streamUrl = "https://wyms.streamguys1.com/rhythmLabRadio?platform=rlr_app"

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio(streamUrl)
      audioRef.current.volume = volume / 100

      // Handle audio events
      audioRef.current.addEventListener('play', () => setIsPlaying(true))
      audioRef.current.addEventListener('pause', () => setIsPlaying(false))
      audioRef.current.addEventListener('ended', () => setIsPlaying(false))
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e)
        setIsPlaying(false)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error('Playback error:', error)
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
  }

  useEffect(() => {
    const fetchRadioData = async () => {
      try {
        const edgeFunctionUrl = 'https://iqzecpfmmsjooxuzvdgu.supabase.co/functions/v1/spinitron-proxy'
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!anonKey) {
          console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
          setIsLive(false)
          setIsLoading(false)
          return
        }

        const headers = {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }

        const response = await fetch(`${edgeFunctionUrl}?endpoint=spins&count=1&use_cache=false`, { headers })

        if (response.ok) {
          const data = await response.json()
          const songs = data.items || []

          if (songs.length > 0) {
            const track = songs[0]
            const songData = {
              id: track.id,
              song: track.song,
              artist: track.artist,
              release: track.release,
              label: track.label,
              image: track.image,
              start_time: track.start,
              duration: track.duration,
              episode_title: track.episode?.title,
              station_id: 'rlr-main',
              spinitron_id: track.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_manual: false
            }

            setCurrentSong(songData)
            setIsLive(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch radio data:', error)
        setIsLive(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchRadioData()

    // Update every 15 seconds
    const interval = setInterval(fetchRadioData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <RadioContext.Provider value={{ currentSong, isLive, isLoading, isPlaying, volume, togglePlayPause, setVolume }}>
      {children}
    </RadioContext.Provider>
  )
}

export function useRadio() {
  const context = useContext(RadioContext)
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider')
  }
  return context
}