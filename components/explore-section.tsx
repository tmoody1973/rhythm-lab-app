"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import { sb } from "@/src/lib/storyblok"
import Link from "next/link"

type ContentType = 'all' | 'blog' | 'deep-dives' | 'profiles'

interface ContentItem {
  id: number
  slug: string
  name: string
  full_slug: string
  content: any
  published_at: string
  created_at: string
  type: 'blog' | 'deep-dive' | 'profile'
}

// Helper function to generate consistent colors
function getContentColor(id: number) {
  const colors = [
    "#8b5cf6", "#ec4899", "#00d4ff", "#f59e0b",
    "#10b981", "#ef4444", "#3b82f6", "#8b5a2b"
  ];
  return colors[id % colors.length];
}

// Helper function to get content type label
function getTypeLabel(type: string) {
  switch (type) {
    case 'blog': return 'BLOG POST'
    case 'deep-dive': return 'EPISODE'
    case 'profile': return 'PROFILE'
    default: return 'CONTENT'
  }
}

// Helper function to get route prefix
function getRoutePrefix(type: string) {
  switch (type) {
    case 'blog': return '/blog'
    case 'deep-dive': return '/deep-dives'
    case 'profile': return '/profiles'
    default: return ''
  }
}

export function ExploreSection() {
  const [activeFilter, setActiveFilter] = useState<ContentType>('all')
  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllContent()
  }, [])

  const fetchAllContent = async () => {
    try {
      setLoading(true)
      const storyblokApi = sb()

      // Fetch content from all three sources
      const [blogResponse, deepDiveResponse, profilesResponse] = await Promise.all([
        // Blog posts
        storyblokApi.get('cdn/stories', {
          version: 'published',
          per_page: 50,
          sort_by: 'first_published_at:desc',
          starts_with: 'blog/'
        }).catch(() => ({ data: { stories: [] } })),

        // Deep dives
        storyblokApi.get('cdn/stories', {
          version: 'published',
          per_page: 50,
          sort_by: 'first_published_at:desc',
          starts_with: 'deep-dive/'
        }).catch(() => ({ data: { stories: [] } })),

        // Profiles
        storyblokApi.get('cdn/stories', {
          version: 'published',
          per_page: 50,
          sort_by: 'first_published_at:desc',
          starts_with: 'profiles/'
        }).catch(() => ({ data: { stories: [] } }))
      ])

      // Combine and type all content
      const blogPosts: ContentItem[] = (blogResponse.data.stories || []).map((story: any) => ({
        ...story,
        type: 'blog' as const
      }))

      const deepDives: ContentItem[] = (deepDiveResponse.data.stories || []).map((story: any) => ({
        ...story,
        type: 'deep-dive' as const
      }))

      const profiles: ContentItem[] = (profilesResponse.data.stories || []).map((story: any) => ({
        ...story,
        type: 'profile' as const
      }))

      // Combine all content and sort by date
      const combined = [...blogPosts, ...deepDives, ...profiles].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime()
        const dateB = new Date(b.published_at || b.created_at).getTime()
        return dateB - dateA // Most recent first
      })

      setAllContent(combined)
      console.log('Fetched explore content:', {
        blog: blogPosts.length,
        deepDives: deepDives.length,
        profiles: profiles.length,
        total: combined.length
      })

    } catch (err) {
      console.error('Error fetching explore content:', err)
      setError('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  // Filter content based on active filter
  const filteredContent = allContent.filter(item => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'blog') return item.type === 'blog'
    if (activeFilter === 'deep-dives') return item.type === 'deep-dive'
    if (activeFilter === 'profiles') return item.type === 'profile'
    return true
  })

  const filterButtons = [
    { key: 'all' as ContentType, label: 'All' },
    { key: 'blog' as ContentType, label: 'Blog' },
    { key: 'deep-dives' as ContentType, label: 'Deep Dives' },
    { key: 'profiles' as ContentType, label: 'Profiles' }
  ]

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Explore</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">Real-time</span>
          </div>
        </div>

        <div className="flex gap-2">
          {filterButtons.map(button => (
            <div key={button.key} className="h-10 w-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Explore</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm text-muted-foreground">Error</span>
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Button onClick={fetchAllContent} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Explore</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-muted-foreground">Real-time</span>
        </div>
      </div>

      {/* Filter Navigation */}
      <div className="flex gap-2">
        {filterButtons.map(button => (
          <Button
            key={button.key}
            variant={activeFilter === button.key ? "default" : "outline"}
            size="sm"
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === button.key
                ? "bg-orange-100 text-orange-900 hover:bg-orange-200 border-orange-200"
                : "bg-transparent border-border/50 text-muted-foreground hover:bg-muted/50"
            }`}
            onClick={() => setActiveFilter(button.key)}
          >
            {button.label}
          </Button>
        ))}
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No {activeFilter === 'all' ? 'content' : activeFilter.replace('-', ' ')} available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContent.slice(0, 12).map((item) => {
            const itemColor = getContentColor(item.id)
            const routePrefix = getRoutePrefix(item.type)

            return (
              <Card
                key={item.id}
                className="bg-background hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-border/50 rounded-xl group"
              >
                <Link href={`${routePrefix}/${item.slug}`}>
                  {/* Image/Artwork Section */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted/20">
                    {item.content?.featured_image?.filename ? (
                      <img
                        src={item.content.featured_image.filename}
                        alt={item.content.featured_image.alt || item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-lg font-bold p-4 text-center"
                        style={{ backgroundColor: itemColor }}
                      >
                        {item.name}
                      </div>
                    )}

                    {/* Play Button for Episodes */}
                    {item.type === 'deep-dive' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <Button
                          className="text-white bg-black/50 hover:bg-black/70 rounded-full px-6"
                          style={{ backgroundColor: itemColor + '90' }}
                        >
                          ▶ Play
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>

                <CardContent className="p-4">
                  {/* Type Badge & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      className="text-white text-xs px-3 py-1 rounded-full font-medium"
                      style={{ backgroundColor: itemColor }}
                    >
                      {getTypeLabel(item.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.published_at || item.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`${routePrefix}/${item.slug}`}>
                    <h3 className="text-foreground font-bold text-sm mb-2 leading-tight hover:text-primary transition-colors line-clamp-2">
                      {item.name.toUpperCase()}
                    </h3>
                  </Link>

                  {/* Description */}
                  {(item.content?.intro || item.content?.description) && (
                    <p className="text-muted-foreground text-xs mb-3 leading-relaxed line-clamp-2">
                      {item.content.intro || item.content.description}
                    </p>
                  )}

                  {/* Tags */}
                  {(item.content?.tags || item.content?.genres) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(item.content.tags || item.content.genres || []).slice(0, 4).map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ borderColor: itemColor + '50', color: itemColor }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>
                        {item.content?.duration || item.content?.read_time || '5 min read'}
                        {item.content?.plays && ` • ${item.content.plays} plays`}
                      </span>
                      <FavoriteButton
                        content={{
                          id: item.id.toString(),
                          title: item.name,
                          type: item.type === 'blog' ? 'blog_post' : item.type === 'deep-dive' ? 'deep_dive' : 'artist_profile',
                          image: item.content?.featured_image?.filename,
                          description: item.content?.intro || item.content?.description
                        }}
                        size="sm"
                      />
                    </div>
                    {item.type === 'deep-dive' && (
                      <Link href={`${routePrefix}/${item.slug}`}>
                        <Button
                          size="sm"
                          className="text-white text-xs px-3 py-1 h-6"
                          style={{ backgroundColor: itemColor }}
                        >
                          ▶ Play
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Show More Button */}
      {filteredContent.length > 12 && (
        <div className="text-center pt-6">
          <Button variant="outline" size="lg">
            Show More ({filteredContent.length - 12} more)
          </Button>
        </div>
      )}
    </section>
  )
}