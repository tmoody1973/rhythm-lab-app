'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, ExternalLink } from "lucide-react"

interface MiniMixcloudPlayerProps {
  embedCode: string
  showTitle: string
  showId: string
  mixcloudUrl: string
  isActive: boolean
  onPlay: (showId: string) => void
  className?: string
}

interface MixcloudWidget {
  ready: (callback: () => void) => void
  play: () => void
  pause: () => void
  toggle: () => void
  bind: (event: string, callback: (data?: any) => void) => void
  unbind: (event: string) => void
}

declare global {
  interface Window {
    Mixcloud: {
      PlayerWidget: (iframe: HTMLIFrameElement) => MixcloudWidget
    }
  }
}

export function MiniMixcloudPlayer({
  embedCode,
  showTitle,
  showId,
  mixcloudUrl,
  isActive,
  onPlay,
  className = ""
}: MiniMixcloudPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<MixcloudWidget | null>(null)

  // Load Mixcloud Widget API
  useEffect(() => {
    if (!isActive) return

    const loadMixcloudAPI = () => {
      if (typeof window !== 'undefined' && window.Mixcloud && typeof window.Mixcloud.PlayerWidget === 'function') {
        initializeWidget()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://widget.mixcloud.com/media/js/widgetApi.js'
      script.onload = () => {
        // Wait a bit for the API to be fully available
        setTimeout(initializeWidget, 500)
      }
      script.onerror = () => {
        console.error('Failed to load Mixcloud Widget API')
      }
      document.head.appendChild(script)
    }

    const initializeWidget = () => {
      if (iframeRef.current && window.Mixcloud && window.Mixcloud.PlayerWidget) {
        try {
          const widget = window.Mixcloud.PlayerWidget(iframeRef.current)
          widgetRef.current = widget

          if (widget && typeof widget.ready === 'function') {
            widget.ready(() => {
              console.log('Mini Mixcloud widget ready for:', showTitle)
              setIsReady(true)

              // Bind events
              if (typeof widget.bind === 'function') {
                widget.bind('play', () => {
                  console.log('Playing:', showTitle)
                  setIsPlaying(true)
                })

                widget.bind('pause', () => {
                  console.log('Paused:', showTitle)
                  setIsPlaying(false)
                })

                widget.bind('ended', () => {
                  console.log('Ended:', showTitle)
                  setIsPlaying(false)
                })
              }
            })
          } else {
            console.error('Mini widget ready function not available')
          }
        } catch (error) {
          console.error('Error initializing mini Mixcloud widget:', error)
        }
      } else {
        console.warn('Mixcloud API or iframe not ready for mini player')
      }
    }

    // Wait for component to mount and iframe to be ready
    const timer = setTimeout(() => {
      loadMixcloudAPI()
    }, 500)

    return () => clearTimeout(timer)
  }, [isActive, embedCode, showTitle])

  // Pause when not active
  useEffect(() => {
    if (!isActive && widgetRef.current && isPlaying) {
      try {
        if (typeof widgetRef.current.pause === 'function') {
          widgetRef.current.pause()
        }
      } catch (error) {
        console.error('Error pausing inactive mini player:', error)
      }
    }
  }, [isActive, isPlaying])

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Notify parent that this player should be active
    onPlay(showId)

    if (!widgetRef.current || !isReady) return

    try {
      if (isPlaying) {
        if (typeof widgetRef.current.pause === 'function') {
          widgetRef.current.pause()
        }
      } else {
        if (typeof widgetRef.current.play === 'function') {
          widgetRef.current.play()
        }
      }
    } catch (error) {
      console.error('Error controlling mini player playback:', error)
    }
  }

  // Create iframe from embed code
  const createIframe = () => {
    if (!isActive) return null

    // Extract src from embed code
    const srcMatch = embedCode.match(/src="([^"]+)"/)
    const src = srcMatch ? srcMatch[1] : ''

    if (!src) return null

    // Add API parameter to enable widget control
    const apiSrc = src.includes('?')
      ? `${src}&api=1&enable_api_listener=1`
      : `${src}?api=1&enable_api_listener=1`

    return (
      <iframe
        ref={iframeRef}
        src={apiSrc}
        width="100%"
        height="60"
        frameBorder="0"
        allow="autoplay"
        className="w-full hidden"  // Hide the iframe, use custom controls
      />
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hidden iframe for API control */}
      {isActive && (
        <div className="hidden">
          {createIframe()}
        </div>
      )}

      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayPause}
        disabled={isActive && !isReady}
        size="sm"
        className={`${
          isActive && isReady
            ? isPlaying
              ? 'bg-[#b12e2e] hover:bg-[#8e2424] text-white'
              : 'bg-[#b12e2e] hover:bg-[#8e2424] text-white'
            : 'bg-[#2a2f3e] hover:bg-[#3a3f4e] text-[#a1a1aa]'
        } w-10 h-10 rounded-full p-0`}
      >
        {isActive && isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>

      {/* Now Playing Indicator */}
      {isActive && isPlaying && (
        <div className="flex items-center gap-1 text-xs text-[#b12e2e]">
          <Volume2 className="h-3 w-3" />
          <span>Now Playing</span>
        </div>
      )}

      {/* External Link */}
      <a
        href={mixcloudUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[#a1a1aa] hover:text-[#b12e2e] transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}