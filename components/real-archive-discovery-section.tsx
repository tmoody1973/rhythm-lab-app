'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FavoriteButton } from "@/components/favorite-button"
import { MiniMixcloudOEmbedPlayer } from "@/components/mini-mixcloud-oembed-player"
import { Search, Clock, Music2 } from "lucide-react"
import Link from "next/link"

interface Show {
  id: string
  slug: string
  title: string
  description: string
  published_date: string
  mixcloud_picture: string
  mixcloud_url: string
  duration_formatted: string
  track_count: number
  tags: string[]
}

interface ShowsResponse {
  success: boolean
  shows: Show[]
  total_count: number
}

export function RealArchiveDiscoverySection() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPlayingShow, setCurrentPlayingShow] = useState<string | null>(null)

  // Color schemes for different show types
  const colorSchemes = [
    { bg: 'bg-[#8b5cf6]', border: 'border-[#8b5cf6]', text: 'text-[#8b5cf6]', hover: 'hover:bg-[#7c3aed]' },
    { bg: 'bg-[#b12e2e]', border: 'border-[#b12e2e]', text: 'text-[#b12e2e]', hover: 'hover:bg-[#8e2424]' },
    { bg: 'bg-[#f59e0b]', border: 'border-[#f59e0b]', text: 'text-[#f59e0b]', hover: 'hover:bg-[#d97706]' },
    { bg: 'bg-[#10b981]', border: 'border-[#10b981]', text: 'text-[#10b981]', hover: 'hover:bg-[#059669]' },
    { bg: 'bg-[#ef4444]', border: 'border-[#ef4444]', text: 'text-[#ef4444]', hover: 'hover:bg-[#dc2626]' },
    { bg: 'bg-[#06b6d4]', border: 'border-[#06b6d4]', text: 'text-[#06b6d4]', hover: 'hover:bg-[#0891b2]' }
  ]

  const fetchShows = async (searchTerm: string = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '12',
        offset: '0',
        status: 'published'
      })

      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(`/api/storyblok/shows?${params}`)
      const data: ShowsResponse = await response.json()

      if (data.success) {
        setShows(data.shows)
        setTotalCount(data.total_count)
      } else {
        console.error('Failed to fetch shows:', data)
        setShows([])
      }
    } catch (error) {
      console.error('Error fetching shows:', error)
      setShows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShows()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchShows(search)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const getColorScheme = (index: number) => {
    return colorSchemes[index % colorSchemes.length]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your Mixcloud shows...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search shows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Archive Shows Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
            📁 Mixcloud Archive ({totalCount} shows)
          </h2>

          {shows.length === 0 ? (
            <div className="text-center py-12">
              <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? `No shows found for "${search}"` : 'No shows available yet'}
              </p>
              {search && (
                <Button
                  variant="outline"
                  onClick={() => { setSearch(''); fetchShows(); }}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {shows.map((show, index) => {
                const colors = getColorScheme(index)

                return (
                  <Card
                    key={show.id}
                    className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl group"
                  >
                    <Link href={`/show/${show.slug}`}>
                      <div className="aspect-[16/9] relative overflow-hidden">
                        {show.mixcloud_picture ? (
                          <img
                            src={show.mixcloud_picture}
                            alt={`${show.title} artwork`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/images/ALBUM-DEFAULT.png"
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br from-${colors.bg.replace('bg-', '')} to-opacity-80 flex items-center justify-center`}>
                            <Music2 className="h-16 w-16 text-white/80" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${colors.bg} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                          MIXCLOUD
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {formatDate(show.published_date)}
                        </span>
                      </div>

                      <Link href={`/show/${show.slug}`}>
                        <h3 className="text-foreground font-bold text-lg mb-2 leading-tight text-balance hover:text-primary transition-colors">
                          {show.title}
                        </h3>
                      </Link>

                      <p className="text-muted-foreground text-sm mb-3 leading-relaxed line-clamp-2">
                        {show.description || 'No description available'}
                      </p>

                      {show.tags && show.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {show.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="outline"
                              className={`${colors.border} ${colors.text} text-xs px-3 py-1 rounded-full font-medium`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {show.duration_formatted || 'Unknown'}
                          </span>
                          <span>{show.track_count} tracks</span>
                          <FavoriteButton
                            content={{
                              id: show.id,
                              title: show.title,
                              type: 'show',
                              image: show.mixcloud_picture || "/images/ALBUM-DEFAULT.png",
                              description: show.description
                            }}
                            size="sm"
                          />
                        </div>

                        {/* Mini Player */}
                        {show.mixcloud_url && (
                          <MiniMixcloudOEmbedPlayer
                            mixcloudUrl={show.mixcloud_url}
                            showTitle={show.title}
                            showId={show.id}
                            isActive={currentPlayingShow === show.id}
                            onPlay={(showId) => setCurrentPlayingShow(showId)}
                            className=""
                          />
                        )}

                        <div className="flex justify-end">
                          <Link href={`/show/${show.slug}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-sm px-4 py-2"
                            >
                              Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}