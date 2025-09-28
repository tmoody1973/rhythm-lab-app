'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Music } from 'lucide-react'

interface TrackAlbumArtProps {
  trackId: string
  artist?: string
  song?: string
  className?: string
  fallbackIcon?: boolean
}

export function TrackAlbumArt({ trackId, artist, song, className = '', fallbackIcon = true }: TrackAlbumArtProps) {
  const [albumArt, setAlbumArt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!artist || !song) return

    const fetchAlbumArt = async () => {
      setLoading(true)
      setError(false)

      try {
        // Use the existing track enhancement API
        const response = await fetch(`/api/track-enhancements/${trackId}`)
        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()

        if (data.enhancedData?.spotify?.albumArt) {
          setAlbumArt(data.enhancedData.spotify.albumArt)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Error fetching album art:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    // Debounce and cache to avoid excessive API calls
    const timer = setTimeout(fetchAlbumArt, 100)
    return () => clearTimeout(timer)
  }, [trackId, artist, song])

  if (!albumArt || error) {
    if (!fallbackIcon) return null

    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <Music className="w-8 h-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <Image
        src={albumArt}
        alt={`${artist} - ${song}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 64px, 128px"
        onError={() => setError(true)}
      />
    </div>
  )
}