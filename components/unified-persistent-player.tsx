"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X, Radio, Podcast } from "lucide-react"
import { useUnifiedPlayer } from "@/lib/audio/unified-player-context"
import { useRadio } from "@/lib/radio/context"

export function UnifiedPersistentPlayer() {
  const {
    currentSource,
    currentEpisode,
    liveStreamInfo,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    isLiveStreaming,
    togglePlay,
    seek,
    setVolume: setPlayerVolume,
    toggleMute,
    pause,
    playLiveStream,
    stop
  } = useUnifiedPlayer()

  const { currentSong } = useRadio() // For live stream "now playing" info

  const [showPlayer, setShowPlayer] = useState(true)

  // Don't render if no audio source is active
  if ((!currentEpisode && !liveStreamInfo) || !showPlayer) {
    return null
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleProgressChange = (value: number[]) => {
    // Only allow seeking for podcasts
    if (currentSource === 'podcast') {
      seek(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setPlayerVolume(value[0])
  }

  const skipForward = () => {
    if (currentSource === 'podcast') {
      seek(Math.min(currentTime + 15, duration))
    }
  }

  const skipBackward = () => {
    if (currentSource === 'podcast') {
      seek(Math.max(currentTime - 15, 0))
    }
  }

  const handleClose = () => {
    stop()
    setShowPlayer(false)
  }

  const handleSwitchToLiveStream = () => {
    if (liveStreamInfo) return // Already playing live stream

    // Switch to live stream with default stream URL
    playLiveStream({
      streamUrl: 'https://wyms.streamguys1.com/rhythmLabRadio?platform=rlr_app',
      stationName: 'Sound Refinery Live',
      currentSong: currentSong || undefined
    })
  }

  const isLive = currentSource === 'live'
  const isPodcast = currentSource === 'podcast'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border/50 backdrop-blur-sm z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3">

          {/* Audio Source Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 border border-border/50 overflow-hidden rounded flex-shrink-0 flex items-center justify-center">
              {isPodcast && currentEpisode?.imageUrl ? (
                <img
                  src={currentEpisode.imageUrl}
                  alt="Episode artwork"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-xs font-bold">
                  {isLive ? <Radio className="w-6 h-6" /> : <Podcast className="w-6 h-6" />}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  isLive ? 'bg-red-500' : 'bg-purple-500'
                }`}>
                  {isLive ? 'LIVE' : 'PODCAST'}
                </div>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  SOUND REFINERY
                </span>
                {isLive && isLiveStreaming && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>

              {isPodcast && currentEpisode && (
                <h4 className="text-sm font-medium text-foreground truncate">
                  {currentEpisode.title}
                </h4>
              )}

              {isLive && (
                <>
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {currentSong ? `${currentSong.artist} - ${currentSong.song}` : 'Sound Refinery Live'}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentSong?.release || 'Live Radio Stream'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar - Only for Podcasts */}
          {isPodcast && (
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
          )}

          {/* Live Stream Indicator - Only for Live */}
          {isLive && (
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md justify-center">
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">LIVE STREAM</span>
              </div>
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            {/* Skip controls only for podcasts */}
            {isPodcast && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              disabled={isLoading}
              className={`h-10 w-10 p-0 border ${
                isLive
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {isPodcast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Source Switch Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchToLiveStream}
              disabled={isLive}
              className={`h-8 w-8 p-0 ${
                isLive
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-muted-foreground hover:text-red-500'
              }`}
              title="Switch to Live Stream"
            >
              <Radio className="h-4 w-4" />
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
              <div className={`w-2 h-2 rounded-full ${
                isPlaying
                  ? (isLive ? 'bg-red-500 animate-pulse' : 'bg-purple-500 animate-pulse')
                  : 'bg-gray-400'
              }`} />
              <span>{isPlaying ? (isLive ? 'LIVE' : 'PLAYING') : 'PAUSED'}</span>
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

        {/* Mobile Progress Bar - Only for Podcasts */}
        {isPodcast && (
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
        )}
      </div>
    </div>
  )
}