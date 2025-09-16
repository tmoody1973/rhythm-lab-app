"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Song } from "@/lib/database/types"

interface RadioContextType {
  currentSong: Song | null
  isLive: boolean
  isLoading: boolean
}

const RadioContext = createContext<RadioContextType | undefined>(undefined)

export function RadioProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRadioData = async () => {
      try {
        const edgeFunctionUrl = 'https://iqzecpfmmsjooxuzvdgu.supabase.co/functions/v1/spinitron-proxy'
        const headers = {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
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
              station_id: 'rlr-main'
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
    <RadioContext.Provider value={{ currentSong, isLive, isLoading }}>
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