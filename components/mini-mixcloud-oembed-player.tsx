'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Play, Pause, ExternalLink } from "lucide-react"

interface MiniMixcloudOEmbedPlayerProps {
  mixcloudUrl: string
  showTitle: string
  showId: string
  isActive: boolean
  onPlay: (showId: string) => void
  className?: string
}

interface OEmbedResponse {
  type: string
  version: string
  provider_name: string
  provider_url: string
  title: string
  author_name: string
  author_url: string
  html: string
  width: number
  height: number
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
}

export function MiniMixcloudOEmbedPlayer({
  mixcloudUrl,
  showTitle,
  showId,
  isActive,
  onPlay,
  className = ""
}: MiniMixcloudOEmbedPlayerProps) {
  const [embedHtml, setEmbedHtml] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isActive && !embedHtml && !error) {
      fetchOEmbedData()
    }
  }, [isActive, embedHtml, error, mixcloudUrl])

  const fetchOEmbedData = async () => {
    try {
      setLoading(true)
      setError('')

      // Use Mixcloud's oEmbed endpoint with mini parameters and light mode
      const oEmbedUrl = new URL('https://app.mixcloud.com/oembed')
      oEmbedUrl.searchParams.set('url', mixcloudUrl)
      oEmbedUrl.searchParams.set('format', 'json')
      oEmbedUrl.searchParams.set('maxwidth', '400')
      oEmbedUrl.searchParams.set('maxheight', '120')
      oEmbedUrl.searchParams.set('light', '1')

      console.log('Fetching mini oEmbed data:', oEmbedUrl.toString())

      const response = await fetch(oEmbedUrl.toString())

      if (!response.ok) {
        throw new Error(`oEmbed API error: ${response.status}`)
      }

      const data: OEmbedResponse = await response.json()
      console.log('Mini oEmbed response:', data)

      if (data.html) {
        // Modify the HTML to be more compact for mini player and ensure light mode
        let modifiedHtml = data.html

        // Make it more compact by adjusting height if possible
        if (modifiedHtml.includes('height="')) {
          modifiedHtml = modifiedHtml.replace(/height="[^"]*"/, 'height="60"')
        }

        // Add light=1 parameter to the iframe src if not already present
        if (modifiedHtml.includes('src="') && !modifiedHtml.includes('light=1')) {
          modifiedHtml = modifiedHtml.replace(
            /src="([^"]*)"/,
            (match, src) => {
              const separator = src.includes('?') ? '&' : '?'
              return `src="${src}${separator}light=1"`
            }
          )
        }

        setEmbedHtml(modifiedHtml)
      } else {
        throw new Error('No HTML content in oEmbed response')
      }
    } catch (err) {
      console.error('Error fetching mini oEmbed data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load mini player')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Notify parent that this player should be active
    onPlay(showId)

    if (!isActive) {
      // Will trigger the useEffect to load the embed
      return
    }

    // Toggle playing state (this is just visual, actual control is in the iframe)
    setIsPlaying(!isPlaying)
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayClick}
        disabled={loading}
        size="sm"
        className={`${
          isActive
            ? 'bg-[#b12e2e] hover:bg-[#8e2424] text-white'
            : 'bg-[#2a2f3e] hover:bg-[#3a3f4e] text-[#a1a1aa]'
        } w-10 h-10 rounded-full p-0 flex-shrink-0`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
        ) : isActive && isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>

      {/* Embedded Player - Hidden but Functional */}
      {isActive && embedHtml && (
        <div className="hidden">
          <div
            dangerouslySetInnerHTML={{ __html: embedHtml }}
          />
        </div>
      )}

      {/* Show basic player info when active */}
      {isActive && !error && !loading && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-[#b12e2e]">
            <span>●</span>
            <span className="truncate">Mixcloud Player Active</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 flex-1 min-w-0 text-xs text-red-400">
          <span>Player Error</span>
        </div>
      )}

      {/* External Link */}
      <a
        href={mixcloudUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[#a1a1aa] hover:text-[#b12e2e] transition-colors flex-shrink-0"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}