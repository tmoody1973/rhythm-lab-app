"use client"

import { useState } from 'react'
import { Play, ExternalLink, Music, User, Calendar, Disc, MoreVertical, Youtube } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface TrackEnhancementMenuProps {
  artist: string
  track: string
  youtubeUrl?: string
  discogsUrl?: string
  className?: string
}

interface YouTubeModalProps {
  isOpen: boolean
  onClose: () => void
  artist: string
  track: string
  youtubeUrl: string
}

interface DiscogsModalProps {
  isOpen: boolean
  onClose: () => void
  artist: string
  discogsUrl: string
}

/**
 * Extract YouTube video ID from URL
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      return urlObj.searchParams.get('v')
    }
    return null
  } catch {
    return null
  }
}

/**
 * YouTube Video Modal Component
 */
function YouTubeModal({ isOpen, onClose, artist, track, youtubeUrl }: YouTubeModalProps) {
  const videoId = getYouTubeVideoId(youtubeUrl)

  if (!videoId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              YouTube Video
            </DialogTitle>
            <DialogDescription>
              Unable to load video for "{track}" by {artist}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="relative">
          {/* Header */}
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Youtube className="h-5 w-5 text-red-500" />
                {track}
              </DialogTitle>
              <DialogDescription className="text-base">
                by {artist}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Video Player */}
          <div className="px-6 pb-4">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
                title={`${track} by ${artist}`}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-2 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(youtubeUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in YouTube
            </Button>
            <Button onClick={onClose} variant="default" size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Discogs Artist Modal Component
 */
function DiscogsModal({ isOpen, onClose, artist, discogsUrl }: DiscogsModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="relative">
          {/* Header */}
          <div className="p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Disc className="h-5 w-5 text-purple-500" />
                {artist}
              </DialogTitle>
              <DialogDescription className="text-base">
                Artist discography and information from Discogs
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Discogs Content */}
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  <p className="text-sm text-muted-foreground">Loading artist information...</p>
                </div>
              </div>
            )}

            <div className="h-[60vh]">
              <iframe
                src={discogsUrl}
                title={`${artist} on Discogs`}
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(discogsUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Discogs
            </Button>
            <Button onClick={onClose} variant="default" size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Three-dot menu component for track enhancement
 */
export function TrackEnhancementMenu({
  artist,
  track,
  youtubeUrl,
  discogsUrl,
  className
}: TrackEnhancementMenuProps) {
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false)
  const [discogsModalOpen, setDiscogsModalOpen] = useState(false)

  const hasEnhancements = youtubeUrl || discogsUrl

  if (!hasEnhancements) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 w-6 p-0 hover:bg-accent", className)}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Track options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {youtubeUrl && (
            <DropdownMenuItem
              onClick={() => setYoutubeModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Youtube className="h-4 w-4 text-red-500" />
              Watch on YouTube
            </DropdownMenuItem>
          )}
          {discogsUrl && (
            <DropdownMenuItem
              onClick={() => setDiscogsModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Disc className="h-4 w-4 text-purple-500" />
              View on Discogs
            </DropdownMenuItem>
          )}
          {youtubeUrl && discogsUrl && <DropdownMenuSeparator />}
          {youtubeUrl && (
            <DropdownMenuItem
              onClick={() => window.open(youtubeUrl, '_blank')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
              Open YouTube Link
            </DropdownMenuItem>
          )}
          {discogsUrl && (
            <DropdownMenuItem
              onClick={() => window.open(discogsUrl, '_blank')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
              Open Discogs Link
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* YouTube Modal */}
      {youtubeUrl && (
        <YouTubeModal
          isOpen={youtubeModalOpen}
          onClose={() => setYoutubeModalOpen(false)}
          artist={artist}
          track={track}
          youtubeUrl={youtubeUrl}
        />
      )}

      {/* Discogs Modal */}
      {discogsUrl && (
        <DiscogsModal
          isOpen={discogsModalOpen}
          onClose={() => setDiscogsModalOpen(false)}
          artist={artist}
          discogsUrl={discogsUrl}
        />
      )}
    </>
  )
}

/**
 * Enhanced track list item component with enhancement menu
 */
interface EnhancedTrackListItemProps {
  position: number
  artist: string
  track: string
  youtubeUrl?: string
  discogsUrl?: string
  className?: string
}

export function EnhancedTrackListItem({
  position,
  artist,
  track,
  youtubeUrl,
  discogsUrl,
  className
}: EnhancedTrackListItemProps) {
  const hasEnhancements = youtubeUrl || discogsUrl

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg bg-[#f5f1eb] hover:bg-[#e8ddd1] cursor-pointer transition-colors border border-[#d4c4a8] shadow-sm group",
      className
    )}>
      {/* Track Position */}
      <span className="text-[#8b6914] text-lg font-bold w-8">
        {position}
      </span>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[#2d1810] font-semibold text-base mb-1">
          {artist}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[#6b4226] text-sm truncate">
            {track}
          </p>
          {hasEnhancements && (
            <div className="flex gap-1">
              {youtubeUrl && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  <Youtube className="h-3 w-3 mr-1 text-red-500" />
                  YouTube
                </Badge>
              )}
              {discogsUrl && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  <Disc className="h-3 w-3 mr-1 text-purple-500" />
                  Discogs
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhancement Menu */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrackEnhancementMenu
          artist={artist}
          track={track}
          youtubeUrl={youtubeUrl}
          discogsUrl={discogsUrl}
          className="text-[#8b6914] hover:text-[#2f5233] hover:bg-[#e8ddd1]"
        />
      </div>
    </div>
  )
}

/**
 * Track list component for shows with enhancements
 */
interface EnhancedTrackListProps {
  tracks: Array<{
    id: string
    position: number
    artist: string
    track: string
    youtube_url?: string
    discogs_url?: string
  }>
  className?: string
}

export function EnhancedTrackList({ tracks, className }: EnhancedTrackListProps) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="h-12 w-12 text-[#8b6914] mx-auto mb-4" />
        <p className="text-[#6b4226]">No tracklist available for this show</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {tracks.map((track) => (
        <EnhancedTrackListItem
          key={track.id}
          position={track.position}
          artist={track.artist}
          track={track.track}
          youtubeUrl={track.youtube_url}
          discogsUrl={track.discogs_url}
        />
      ))}
    </div>
  )
}