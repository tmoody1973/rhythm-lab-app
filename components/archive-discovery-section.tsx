'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Show {
  id: string
  title: string
  description: string
  published_date: string
  slug: string
  mixcloud_url: string
  mixcloud_picture: string
  track_count: number
  duration_formatted: string | null
  tags: string[]
}

interface WeeklyShowProps {
  latestShow?: Show | null
  showIndex?: number
}

function WeeklyShowCard({ latestShow, showIndex = 0 }: WeeklyShowProps) {
  if (!latestShow) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading latest show...</div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Color schemes for different shows
  const colorSchemes = [
    { bg: 'bg-[#8b5cf6]', border: 'border-[#8b5cf6]', text: 'text-[#8b5cf6]', hover: 'hover:bg-[#7c3aed]' },
    { bg: 'bg-[#b12e2e]', border: 'border-[#b12e2e]', text: 'text-[#b12e2e]', hover: 'hover:bg-[#8e2424]' },
    { bg: 'bg-[#f59e0b]', border: 'border-[#f59e0b]', text: 'text-[#f59e0b]', hover: 'hover:bg-[#d97706]' },
    { bg: 'bg-[#10b981]', border: 'border-[#10b981]', text: 'text-[#10b981]', hover: 'hover:bg-[#059669]' },
    { bg: 'bg-[#ef4444]', border: 'border-[#ef4444]', text: 'text-[#ef4444]', hover: 'hover:bg-[#dc2626]' }
  ]

  const colors = colorSchemes[showIndex % colorSchemes.length]

  return (
    <Link href={`/show/${latestShow.slug}`}>
      <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl">
        <div className="aspect-[16/9] relative overflow-hidden">
          <img
            src={latestShow.mixcloud_picture || "/images/ALBUM-DEFAULT.png"}
            alt={`${latestShow.title} artwork`}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className={`${colors.bg} text-white text-xs px-3 py-1 rounded-full font-medium`}>WEEKLY</Badge>
            <span className="text-sm text-muted-foreground font-medium">{formatDate(latestShow.published_date)}</span>
          </div>
          <h3 className="text-foreground font-bold text-lg mb-3 leading-tight text-balance">
            {latestShow.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {latestShow.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`${colors.border} ${colors.text} text-xs px-3 py-1 rounded-full font-medium`}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{latestShow.duration_formatted || "2h 15m"} • {latestShow.track_count} tracks</span>
              <FavoriteButton
                content={{
                  id: latestShow.id,
                  title: latestShow.title,
                  type: 'show',
                  image: latestShow.mixcloud_picture || "/images/ALBUM-DEFAULT.png",
                  description: latestShow.description
                }}
                size="sm"
              />
            </div>
            <Button size="sm" className={`${colors.bg} ${colors.hover} text-white text-sm px-4 py-2`}>
              ▶ Play
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ArchiveDiscoverySection() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestShows = async () => {
      try {
        const params = new URLSearchParams({
          limit: '4',
          offset: '0',
          status: 'published'
        })

        const response = await fetch(`/api/storyblok/shows?${params}`)
        const data = await response.json()

        if (data.success && data.shows.length > 0) {
          setShows(data.shows)
        }
      } catch (error) {
        console.error('Error fetching latest shows:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestShows()
  }, [])

  return (
    <div className="space-y-6">
      {/* Archive Shows Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wide flex items-center gap-2 mb-4">WEEKLY SHOW</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Recent Mixcloud Shows - Dynamic */}
            {loading ? (
              <Card className="bg-card/80 backdrop-blur-sm hover:shadow-lg hover:bg-card/90 transition-all duration-200 cursor-pointer overflow-hidden border border-border/30 rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">Loading latest shows...</div>
                </CardContent>
              </Card>
            ) : (
              shows.map((show, index) => (
                <WeeklyShowCard key={show.id} latestShow={show} showIndex={index} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search & Discovery */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">📈 Trending Searches</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { tag: "deep-house", count: 234 },
            { tag: "jazz", count: 189 },
            { tag: "electronic", count: 156 },
            { tag: "ambient", count: 143 },
            { tag: "techno", count: 128 },
            { tag: "fusion", count: 98 },
          ].map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:border-[#b12e2e] hover:text-[#b12e2e] bg-transparent"
            >
              #{item.tag}
              <span className="ml-2 text-xs opacity-60">{item.count}</span>
            </Button>
          ))}
        </div>
      </div>

    </div>
  )
}
