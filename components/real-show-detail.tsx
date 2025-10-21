'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, Users, Share, Bookmark, Music, ArrowLeft, Sparkles, ExternalLink, Music2, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { MixcloudOEmbedPlayer } from "./mixcloud-oembed-player"
import { safeRenderText } from '@/lib/utils/rich-text'

interface Track {
  id: string
  position: number
  artist: string
  track: string
  time_formatted: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
}

interface Show {
  id: string
  title: string
  description: string
  published_date: string
  published_date_formatted: string
  mixcloud_picture: string
  mixcloud_url: string
  mixcloud_embed: string
  duration_formatted: string
  track_count: number
  tags: string[]
}

interface ShowDetailResponse {
  success: boolean
  show: Show
  tracks: Track[]
}

interface RealShowDetailProps {
  showId: string
}

// Helper function to generate YouTube search URL
function generateYouTubeSearchUrl(artist: string, track: string): string {
  const searchQuery = encodeURIComponent(`${artist} ${track}`)
  return `https://www.youtube.com/results?search_query=${searchQuery}`
}

export function RealShowDetail({ showId }: RealShowDetailProps) {
  const [show, setShow] = useState<Show | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPlayingShow, setCurrentPlayingShow] = useState<string | null>(null)
  const [showAllTracks, setShowAllTracks] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    fetchShowDetail()
  }, [showId])

  const fetchShowDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shows/${showId}`)
      const data: ShowDetailResponse = await response.json()

      if (data.success) {
        setShow(data.show)
        setTracks(data.tracks || [])
      } else {
        console.error('Failed to fetch show:', data)
      }
    } catch (error) {
      console.error('Error fetching show:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1eb] text-[#3d2914]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <Music2 className="h-12 w-12 text-[#8b6914] mx-auto mb-4 animate-pulse" />
            <p className="text-[#8b6914]">Loading show details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#f5f1eb] text-[#3d2914]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <Music2 className="h-12 w-12 text-[#8b6914] mx-auto mb-4" />
            <p className="text-[#8b6914]">Show not found</p>
            <Link href="/archive">
              <Button variant="outline" className="mt-4 border-[#8b6914] text-[#8b6914] hover:bg-[#8b6914] hover:text-[#f5f1eb]">
                Back to Archive
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb] text-[#3d2914]">
      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <Link href="/archive">
          <Button variant="ghost" className="text-[#8b6914] hover:text-[#3d2914] hover:bg-[#e8ddd1] mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Archive
          </Button>
        </Link>

        <div className="space-y-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Show Header */}
            <Card className="bg-[#ede3d3] border-[#d4c4a8] shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Show Artwork */}
                  <div className="w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0 rounded-lg overflow-hidden shadow-md mx-auto sm:mx-0">
                    {show.mixcloud_picture ? (
                      <img
                        src={show.mixcloud_picture}
                        alt={`${show.title} artwork`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/images/ALBUM-DEFAULT.png"
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#8b6914] to-[#a0522d] flex items-center justify-center">
                        <Music className="h-16 w-16 sm:h-24 sm:w-24 text-[#f5f1eb]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#2f5233] text-[#f5f1eb] shadow-sm">Mixcloud Show</Badge>
                        {show.track_count > 0 && (
                          <Badge variant="outline" className="border-[#8b6914] text-[#8b6914] bg-[#f5f1eb]">
                            {show.track_count} tracks
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#2d1810] mb-2 break-words hyphens-auto">{show.title}</h1>
                      <p className="text-[#6b4226] text-base sm:text-lg leading-relaxed break-words">
                        {show.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-[#8b6914]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {show.duration_formatted}
                      </span>
                      <span>{show.published_date_formatted}</span>
                    </div>

                    {show.tags && show.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {show.tags
                          .map((tag, index) => {
                            const tagText = safeRenderText(tag);
                            if (!tagText) return null;

                            return (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-[#a0522d] text-[#a0522d] bg-[#f5f1eb] hover:bg-[#a0522d] hover:text-[#f5f1eb]"
                              >
                                {tagText}
                              </Badge>
                            );
                          })
                          .filter(Boolean)}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <a
                        href={show.mixcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none"
                      >
                        <Button className="bg-[#2f5233] hover:bg-[#1e3521] text-[#f5f1eb] shadow-md w-full sm:w-auto">
                          <Play className="h-4 w-4 mr-2" />
                          Play on Mixcloud
                        </Button>
                      </a>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="border-[#8b6914] text-[#8b6914] hover:bg-[#8b6914] hover:text-[#f5f1eb] bg-transparent flex-1 sm:flex-none"
                          onClick={() => copyToClipboard(show.mixcloud_url)}
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          className="border-[#a0522d] text-[#a0522d] hover:bg-[#a0522d] hover:text-[#f5f1eb] bg-transparent flex-1 sm:flex-none"
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mixcloud Player */}
            {show.mixcloud_url && (
              <MixcloudOEmbedPlayer
                mixcloudUrl={show.mixcloud_url}
                showTitle={show.title}
                className=""
                maxWidth={800}
                maxHeight={400}
              />
            )}

            {/* Tracklist */}
            <Card className="bg-[#ede3d3] border-[#d4c4a8] shadow-lg">
              <CardContent className="p-6">
                    {tracks.length > 0 ? (
                      <div className="space-y-6">
                        {/* Tracklist Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-[#2d1810] text-xl font-bold">Tracklist</h3>
                          <div className="flex items-center gap-4">
                            {/* Show All Dropdown */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAllTracks(!showAllTracks)}
                              className="text-[#8b6914] hover:text-[#2f5233] hover:bg-[#e8ddd1]"
                            >
                              Show all
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                            {/* Navigation Buttons - Only show on desktop when not showing all */}
                            {!showAllTracks && tracks.length > 12 && (
                              <div className="hidden md:flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                  disabled={currentPage === 0}
                                  className="text-[#8b6914] hover:text-[#2f5233] hover:bg-[#e8ddd1] disabled:opacity-50 disabled:text-[#d4c4a8]"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCurrentPage(currentPage + 1)}
                                  disabled={(currentPage + 1) * 12 >= tracks.length}
                                  className="text-[#8b6914] hover:text-[#2f5233] hover:bg-[#e8ddd1] disabled:opacity-50 disabled:text-[#d4c4a8]"
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tracklist Grid */}
                        {showAllTracks ? (
                          /* Mobile/Show All View - Vertical Stack */
                          <div className="space-y-2">
                            {tracks.map((track, index) => (
                              <div
                                key={track.id}
                                className="flex items-center gap-4 p-4 rounded-lg bg-[#f5f1eb] hover:bg-[#e8ddd1] cursor-pointer transition-colors border border-[#d4c4a8] shadow-sm"
                              >
                                <span className="text-[#8b6914] text-lg font-bold w-8">
                                  {track.position}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#2d1810] font-semibold text-base mb-1">
                                    {track.discogs_url ? (
                                      <a
                                        href={track.discogs_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-[#8b6914] underline decoration-2 underline-offset-2"
                                      >
                                        {track.artist}
                                      </a>
                                    ) : (
                                      track.artist
                                    )}
                                  </p>
                                  <p className="text-[#6b4226] text-sm">
                                    <a
                                      href={track.youtube_url || generateYouTubeSearchUrl(track.artist, track.track)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-[#a0522d] underline decoration-2 underline-offset-2"
                                    >
                                      {track.track}
                                    </a>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Desktop Grid View - Horizontal Rectangular Cards */
                          <div className="space-y-4">
                            {/* Desktop Grid - 3 columns now that we have full width */}
                            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {tracks.slice(currentPage * 12, (currentPage + 1) * 12).map((track, index) => (
                                <div
                                  key={track.id}
                                  className="flex items-center gap-4 p-4 rounded-lg bg-[#f5f1eb] hover:bg-[#e8ddd1] cursor-pointer transition-colors border border-[#d4c4a8] shadow-sm group"
                                >
                                  <span className="text-[#8b6914] text-lg font-bold w-8 text-center">
                                    {track.position}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[#2d1810] font-semibold text-base mb-1 truncate">
                                      {track.discogs_url ? (
                                        <a
                                          href={track.discogs_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-[#8b6914] underline decoration-2 underline-offset-2"
                                        >
                                          {track.artist}
                                        </a>
                                      ) : (
                                        track.artist
                                      )}
                                    </p>
                                    <p className="text-[#6b4226] text-sm truncate">
                                      <a
                                        href={track.youtube_url || generateYouTubeSearchUrl(track.artist, track.track)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-[#a0522d] underline decoration-2 underline-offset-2"
                                      >
                                        {track.track}
                                      </a>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Mobile List */}
                            <div className="md:hidden space-y-2">
                              {tracks.slice(0, showAllTracks ? tracks.length : 6).map((track, index) => (
                                <div
                                  key={track.id}
                                  className="flex items-center gap-4 p-4 rounded-lg bg-[#f5f1eb] hover:bg-[#e8ddd1] cursor-pointer transition-colors border border-[#d4c4a8] shadow-sm"
                                >
                                  <span className="text-[#8b6914] text-lg font-bold w-8">
                                    {track.position}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[#2d1810] font-semibold text-base mb-1">
                                      {track.discogs_url ? (
                                        <a
                                          href={track.discogs_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-[#8b6914] underline decoration-2 underline-offset-2"
                                        >
                                          {track.artist}
                                        </a>
                                      ) : (
                                        track.artist
                                      )}
                                    </p>
                                    <p className="text-[#6b4226] text-sm">
                                      <a
                                        href={track.youtube_url || generateYouTubeSearchUrl(track.artist, track.track)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-[#a0522d] underline decoration-2 underline-offset-2"
                                      >
                                        {track.track}
                                      </a>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Music className="h-12 w-12 text-[#8b6914] mx-auto mb-4" />
                        <p className="text-[#6b4226]">No tracklist available for this show</p>
                      </div>
                    )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}