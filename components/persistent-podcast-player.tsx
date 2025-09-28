"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X } from "lucide-react"
import { usePodcast } from "@/lib/podcast/context"

export function PersistentPodcastPlayer() {
  const {
    currentEpisode,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume: setPlayerVolume,
    toggleMute,
    pause
  } = usePodcast()

  const [showPlayer, setShowPlayer] = useState(true)

  // Don't render if no episode is loaded
  if (!currentEpisode || !showPlayer) {
    return null
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressChange = (value: number[]) => {
    seek(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setPlayerVolume(value[0])
  }

  const skipForward = () => {
    seek(Math.min(currentTime + 15, duration))
  }

  const skipBackward = () => {
    seek(Math.max(currentTime - 15, 0))
  }

  const handleClose = () => {
    pause()
    setShowPlayer(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border/50 backdrop-blur-sm z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3">

          {/* Episode Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 border border-border/50 overflow-hidden rounded flex-shrink-0 flex items-center justify-center">
              {currentEpisode.imageUrl ? (
                <img
                  src={currentEpisode.imageUrl}
                  alt="Episode artwork"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-xs font-bold">SR</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  PODCAST
                </div>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  SOUND REFINERY
                </span>
              </div>
              <h4 className="text-sm font-medium text-foreground truncate">
                {currentEpisode.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentEpisode.description || 'BBC/NPR-style Deep Dive'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <span className="text-xs text-muted-foreground min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleProgressChange}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

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

            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4" />
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

          {/* Status & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleProgressChange}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}