"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { AuthModal } from './auth/auth-modal'

interface FavoriteButtonProps {
  track?: {
    title: string
    artist: string
    album?: string
    image?: string
  }
  content?: {
    id: string
    title: string
    type: 'blog_post' | 'deep_dive' | 'artist_profile' | 'show'
    image?: string
    description?: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FavoriteButton({ track, content, size = 'md', className = '' }: FavoriteButtonProps) {
  const { user, loading: authLoading } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure consistent hydration
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Check if item is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setIsFavorited(false)
        return
      }

      // Determine item details based on track or content
      let itemId: string
      let itemType: string

      if (track && track.title && track.artist) {
        itemId = `${track.artist}||${track.title}`
        itemType = 'live_track'
      } else if (content && content.id && content.title) {
        itemId = content.id
        itemType = content.type
      } else {
        setIsFavorited(false)
        return
      }

      try {
        const response = await fetch('/api/favorites')

        if (response.ok) {
          const { favorites } = await response.json()
          const isFavorited = favorites.some(
            (fav: any) => fav.item_type === itemType && fav.item_id === itemId
          )

          setIsFavorited(isFavorited)
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
        setIsFavorited(false)
      }
    }

    checkFavoriteStatus()
  }, [user, track?.title, track?.artist, content?.id, content?.title])

  const handleFavorite = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Validate we have required data
    if (track && (!track.title || !track.artist)) {
      return
    }
    if (content && (!content.id || !content.title)) {
      return
    }
    if (!track && !content) {
      return
    }

    setLoading(true)

    try {
      const requestBody = track
        ? {
            track: {
              title: track.title,
              artist: track.artist,
              album: track.album,
              image: track.image,
            },
            action: isFavorited ? 'remove' : 'add',
          }
        : {
            content: {
              id: content!.id,
              title: content!.title,
              type: content!.type,
              image: content!.image,
              description: content!.description,
            },
            action: isFavorited ? 'remove' : 'add',
          }

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        disabled={!mounted || loading || authLoading}
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