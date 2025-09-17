"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { AuthModal } from './auth/auth-modal'

interface FavoriteButtonProps {
  track: {
    title: string
    artist: string
    album?: string
    image?: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FavoriteButton({ track, size = 'md', className = '' }: FavoriteButtonProps) {
  const { user, loading: authLoading } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  }

  // Check if track is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !track.title || !track.artist) {
        setIsFavorited(false)
        return
      }

      try {
        const response = await fetch('/api/favorites')

        if (response.ok) {
          const { favorites } = await response.json()
          const itemId = `${track.artist}||${track.title}`

          const isFavorited = favorites.some(
            (fav: any) => fav.item_type === 'live_track' && fav.item_id === itemId
          )

          setIsFavorited(isFavorited)
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
        setIsFavorited(false)
      }
    }

    checkFavoriteStatus()
  }, [user, track.title, track.artist])

  const handleFavorite = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (!track.title || !track.artist) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track: {
            title: track.title,
            artist: track.artist,
            album: track.album,
            image: track.image,
          },
          action: isFavorited ? 'remove' : 'add',
        }),
      })

      if (response.ok) {
        setIsFavorited(!isFavorited)
      } else {
        const errorData = await response.json()
        console.error('Error updating favorite:', errorData.error)
      }
    } catch (error) {
      console.error('Error updating favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`${sizeClasses[size]} p-0 hover:bg-red-50 hover:text-red-600 transition-colors ${className}`}
        onClick={handleFavorite}
        disabled={loading || authLoading}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          size={iconSizes[size]}
          className={`transition-colors ${
            isFavorited
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-red-500'
          }`}
        />
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </>
  )
}