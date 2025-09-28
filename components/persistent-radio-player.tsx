"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { Song } from "@/lib/database/types"

interface PersistentRadioPlayerProps {
  currentSong?: Song | null
  isLive?: boolean
}

export function PersistentRadioPlayer({ currentSong, isLive }: PersistentRadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([50])
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const streamUrl = "https://wyms.streamguys1.com/rhythmLabRadio?platform=rlr_app"

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  const handlePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio playback failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border/50 backdrop-blur-sm z-30 shadow-lg">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="none"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
        }}
      />

      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">

          {/* Now Playing Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-muted border border-border/50 overflow-hidden rounded flex-shrink-0">
              <img
                src={currentSong?.image || "/images/ALBUM-DEFAULT.png"}
                alt="Album artwork"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isLive && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </div>
                )}
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  RHYTHM LAB RADIO
                </span>
              </div>
              <h4 className="font-bold text-sm truncate">
                {currentSong?.artist || 'Rhythm Lab Radio'}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentSong?.song || 'Live Electronic Music'}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-4">

            {/* Play/Pause Button */}
            <Button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-24">
              <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>

            {/* Stream Status */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="hidden sm:inline">
                {isPlaying ? 'STREAMING' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}