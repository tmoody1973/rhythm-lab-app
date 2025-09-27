"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Volume2, Loader2 } from "lucide-react"
import { useUnifiedPlayer } from "@/lib/audio/unified-player-context"

interface PodcastPlayButtonProps {
  episode: {
    id: string
    title: string
    audioUrl: string
    duration?: number
    description?: string
    imageUrl?: string
    publishedAt?: string
  }
  className?: string
  variant?: 'compact' | 'full'
}

export function PodcastPlayButton({ episode, className = '', variant = 'full' }: PodcastPlayButtonProps) {
  const { currentEpisode, currentSource, isPlaying, isLoading, playPodcast, togglePlay } = useUnifiedPlayer()

  const isCurrentEpisode = currentEpisode?.id === episode.id && currentSource === 'podcast'
  const isCurrentlyPlaying = isCurrentEpisode && isPlaying

  const handleClick = () => {
    if (isCurrentEpisode) {
      togglePlay()
    } else {
      playPodcast(episode)
    }
  }

  if (variant === 'compact') {
    return (
      <Button
        onClick={handleClick}
        disabled={isLoading && isCurrentEpisode}
        className={`${className}`}
        size="sm"
      >
        {isLoading && isCurrentEpisode ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : isCurrentlyPlaying ? (
          <Pause className="w-4 h-4 mr-2" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {isCurrentlyPlaying ? 'Pause' : 'Play'} Podcast
      </Button>
    )
  }

  return (
    <Card className={`p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            {episode.imageUrl ? (
              <img
                src={episode.imageUrl}
                alt="Episode artwork"
                className="w-full h-full object-cover"
              />
            ) : (
              <Volume2 className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              SOUND REFINERY
            </div>
            <span className="text-xs text-purple-600 font-medium">PODCAST</span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{episode.title}</h3>
          {episode.description && (
            <p className="text-sm text-gray-600 truncate">
              {episode.description}
            </p>
          )}
          {episode.duration && (
            <p className="text-xs text-gray-500 mt-1">
              Duration: {Math.round(episode.duration / 60)} minutes
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          <Button
            onClick={handleClick}
            disabled={isLoading && isCurrentEpisode}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading && isCurrentEpisode ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : isCurrentlyPlaying ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>

      {isCurrentEpisode && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="flex items-center gap-2 text-xs text-purple-600">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>
              {isPlaying ? 'Now playing in persistent player below' : 'Paused - resume in player below'}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}