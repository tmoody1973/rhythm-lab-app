'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react"

interface MixcloudPlayerProps {
  embedCode: string
  showTitle: string
  showId: string
  mixcloudUrl: string
  className?: string
  autoplay?: boolean
}

interface MixcloudWidget {
  ready: (callback: () => void) => void
  play: () => void
  pause: () => void
  toggle: () => void
  getDuration: (callback: (duration: number) => void) => void
  getPosition: (callback: (position: number) => void) => void
  seek: (position: number) => void
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

export function MixcloudPlayer({
  embedCode,
  showTitle,
  showId,
  mixcloudUrl,
  className = "",
  autoplay = false
}: MixcloudPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<MixcloudWidget | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  // Load Mixcloud Widget API
  useEffect(() => {
    const loadMixcloudAPI = () => {
      if (window.Mixcloud && window.Mixcloud.PlayerWidget) {
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
              console.log('Mixcloud widget ready')
              setIsReady(true)

              // Get initial duration
              if (typeof widget.getDuration === 'function') {
                widget.getDuration((dur) => {
                  setDuration(dur)
                })
              }

              // Bind events
              if (typeof widget.bind === 'function') {
                widget.bind('play', () => {
                  console.log('Playing')
                  setIsPlaying(true)
                })

                widget.bind('pause', () => {
                  console.log('Paused')
                  setIsPlaying(false)
                })

                widget.bind('ended', () => {
                  console.log('Ended')
                  setIsPlaying(false)
                  setPosition(0)
                })

                widget.bind('progress', (data: { seconds: number }) => {
                  setPosition(data.seconds)
                })
              }

              // Auto-play if requested
              if (autoplay) {
                setTimeout(() => {
                  if (typeof widget.play === 'function') {
                    widget.play()
                  }
                }, 1000)
              }
            })
          } else {
            console.error('Widget ready function not available')
          }
        } catch (error) {
          console.error('Error initializing Mixcloud widget:', error)
        }
      } else {
        console.warn('Mixcloud API or iframe not ready')
      }
    }

    // Wait for component to mount and iframe to be ready
    const timer = setTimeout(() => {
      loadMixcloudAPI()
    }, 500)

    return () => clearTimeout(timer)
  }, [embedCode, autoplay])

  const handlePlayPause = () => {
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
      console.error('Error controlling playback:', error)
    }
  }

  const handleSeek = (percentage: number) => {
    if (!widgetRef.current || !isReady || !duration) return

    try {
      const newPosition = (percentage / 100) * duration
      if (typeof widgetRef.current.seek === 'function') {
        widgetRef.current.seek(newPosition)
      }
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return

    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0

  // Create iframe from embed code
  const createIframe = () => {
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
        className="w-full"
      />
    )
  }

  return (
    <Card className={`bg-[#1e2332] border-[#2a2f3e] ${className}`}>
      <CardContent className="p-4">
        <div ref={playerContainerRef} className="space-y-4">
          {/* Show Title */}
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg truncate">{showTitle}</h3>
            <p className="text-[#a1a1aa] text-sm">Now Playing</p>
          </div>

          {/* Embedded Player */}
          <div className="rounded-lg overflow-hidden bg-[#0a0e1a]">
            {createIframe()}
          </div>

          {/* Custom Controls */}
          <div className="space-y-3">
            {/* Progress Bar */}
            {isReady && duration > 0 && (
              <div className="space-y-1">
                <div
                  className="w-full h-2 bg-[#2a2f3e] rounded-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const percentage = ((e.clientX - rect.left) / rect.width) * 100
                    handleSeek(percentage)
                  }}
                >
                  <div
                    className="h-full bg-[#00d4ff] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#a1a1aa]">
                  <span>{formatTime(position)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Play/Pause Button */}
              <Button
                onClick={handlePlayPause}
                disabled={!isReady}
                size="lg"
                className={`${
                  isReady
                    ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-black'
                    : 'bg-[#2a2f3e] text-[#a1a1aa] cursor-not-allowed'
                } w-14 h-14 rounded-full`}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>

              {/* Additional Controls */}
              <div className="flex items-center gap-2">
                {/* Volume Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#a1a1aa] hover:text-white"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>

                {/* Fullscreen Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#a1a1aa] hover:text-white"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                {/* Mixcloud Link */}
                <a
                  href={mixcloudUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a1a1aa] hover:text-[#00d4ff] transition-colors"
                >
                  <Button variant="ghost" size="sm" className="text-xs">
                    Open in Mixcloud
                  </Button>
                </a>
              </div>
            </div>

            {/* Loading State */}
            {!isReady && (
              <div className="text-center py-4">
                <div className="animate-pulse text-[#a1a1aa] text-sm">Loading player...</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}