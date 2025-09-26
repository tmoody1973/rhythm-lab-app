'use client'

import { useState } from 'react'
import { Play, ExternalLink, Clock, Eye } from 'lucide-react'
import { YouTubeVideo } from '@/lib/youtube/api'

interface YouTubeVideoEmbedProps {
  video: YouTubeVideo
  className?: string
}

/**
 * YouTube Video Embed Component
 * Shows video thumbnail initially, then embeds the video when clicked
 */
export function YouTubeVideoEmbed({ video, className = '' }: YouTubeVideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  if (isPlaying) {
    return (
      <div className={`relative ${className}`}>
        <iframe
          src={`${video.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>
    )
  }

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={handlePlay}>
      {/* Video Thumbnail */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
          <div className="bg-red-600 rounded-full p-3 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="mt-3 space-y-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {video.title}
        </h4>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          {video.channelTitle}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          {video.viewCount && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{video.viewCount}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* External Link */}
      <a
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="Open in YouTube"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

interface YouTubeVideoGridProps {
  videos: YouTubeVideo[]
  loading?: boolean
  error?: string
}

/**
 * Grid layout for multiple YouTube videos
 */
export function YouTubeVideoGrid({ videos, loading, error }: YouTubeVideoGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Unable to load videos</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Play className="w-6 h-6" />
        </div>
        <p className="text-sm">No videos found</p>
        <p className="text-xs mt-1">Try checking YouTube directly for this release</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Featured Video (first one, larger) */}
      {videos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Featured</h4>
          <YouTubeVideoEmbed
            video={videos[0]}
            className="aspect-video"
          />
        </div>
      )}

      {/* Additional Videos Grid */}
      {videos.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">More Videos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.slice(1).map((video) => (
              <YouTubeVideoEmbed
                key={video.id}
                video={video}
                className="aspect-video"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}