"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { useRadio } from "@/lib/radio/context"

export function PersistentAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { currentSong, isLive, isLoading: radioLoading } = useRadio()

  const streamUrl = "https://wyms.streamguys1.com/rhythmLabRadio?platform=rlr_app"

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
    }
  }, [volume])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

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
      console.error('Audio playback failed:', error)
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border/50 backdrop-blur-sm z-50 shadow-lg">
      <audio ref={audioRef} src={streamUrl} preload="none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3">

          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-muted border border-border/50 overflow-hidden rounded flex-shrink-0">
              <img
                src={currentSong?.image || "/images/ALBUM-DEFAULT.png"}
                alt="Album artwork"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
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
              <h4 className="text-sm font-medium text-foreground truncate">
                {radioLoading ? 'Loading...' : currentSong?.artist || 'Rhythm Lab Radio'}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {radioLoading ? 'Fetching current track...' : currentSong?.song || 'Live Electronic Music'}
              </p>
            </div>
          </div>

          {/* Play/Pause Control */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              disabled={isLoading}
              className="h-10 w-10 p-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2 w-32">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>

          {/* Stream Status */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isPlaying ? 'STREAMING' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}