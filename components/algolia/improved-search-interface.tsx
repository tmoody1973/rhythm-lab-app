"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { InstantSearch, SearchBox, Hits, Pagination, Configure, useInstantSearch } from 'react-instantsearch'
import { searchClient, INDICES } from '@/lib/algolia/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music, FileText, Users, Grid, List, Filter, Search, PlayCircle, Calendar, Clock, Brain } from 'lucide-react'
import { TrackAlbumArt } from './track-album-art'
import { DateFilter } from './date-filter'

type SearchType = 'songs' | 'pages' | 'articles' | 'all'
type ViewMode = 'grid' | 'list'

interface ImprovedSearchInterfaceProps {
  initialQuery?: string
  initialSearchType?: string
}

export function ImprovedSearchInterface({
  initialQuery = '',
  initialSearchType = 'all'
}: ImprovedSearchInterfaceProps) {
  const router = useRouter()
  const [searchType, setSearchType] = useState<SearchType>(
    ['all', 'songs', 'pages', 'articles'].includes(initialSearchType)
      ? initialSearchType as SearchType
      : 'all'
  )
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''})

  // Update URL when search type changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (initialQuery) params.set('q', initialQuery)
    if (searchType !== 'all') params.set('type', searchType)

    const url = `/search${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(url, { scroll: false })
  }, [searchType, router, initialQuery])

  // Don't render if search client is not available
  if (!searchClient) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Search Unavailable</h3>
        <p className="text-muted-foreground">Search functionality is currently disabled due to missing configuration.</p>
      </div>
    )
  }

  const getIndexName = () => {
    switch (searchType) {
      case 'songs':
        return INDICES.LIVE_SONGS // Use live songs index for current songs
      case 'pages':
        return INDICES.ARCHIVE_TRACKS // Use archive tracks for archived shows/pages
      case 'articles':
        return INDICES.CONTENT // rhythm_lab_app_articles
      default:
        return INDICES.LIVE_SONGS // Default to live songs
    }
  }

  return (
    <div className="space-y-8">
      {/* Search Type Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1 border">
          {[
            { key: 'all', label: 'All Content', icon: Grid },
            { key: 'songs', label: 'Songs', icon: Music },
            { key: 'pages', label: 'Weekly Show Tracks', icon: PlayCircle },
            { key: 'articles', label: 'Articles', icon: FileText }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={searchType === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setSearchType(key as SearchType)}
              className={`flex items-center gap-2 ${
                searchType === key
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          {searchType === 'songs' && (
            <DateFilter
              onDateRangeChange={(start, end) => setDateRange({start, end})}
              className="relative"
            />
          )}

          <div className="flex rounded-lg border border bg-card">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <InstantSearch searchClient={searchClient} indexName={getIndexName()}>
        <Configure
          hitsPerPage={20}
          attributesToRetrieve={['*']}
          attributesToHighlight={['title', 'content', 'url']}
          highlightPreTag='<mark className="bg-purple-200 text-purple-900 px-1 rounded">'
          highlightPostTag='</mark>'
          {...(dateRange.start && dateRange.end && searchType === 'songs' && {
            filters: `start_timestamp >= ${new Date(dateRange.start).getTime()} AND start_timestamp <= ${new Date(dateRange.end + 'T23:59:59').getTime()}`
          })}
        />

        {/* Search Box */}
        <div className="relative">
          <SearchBox
            placeholder={`Search ${searchType === 'all' ? 'all content' : searchType}...`}
            autoFocus={!initialQuery}
            searchAsYouType={true}
            classNames={{
              root: 'relative',
              form: 'relative',
              input: 'w-full px-6 py-4 pl-14 text-lg bg-background border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              submit: 'absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground',
              reset: 'absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground',
              submitIcon: 'w-5 h-5',
              resetIcon: 'w-5 h-5'
            }}
          />
        </div>

        {/* Search Stats & Insights */}
        <SearchStats />

        {/* Results */}
        <div className="space-y-6">
          <Hits
            hitComponent={({ hit }) => (
              <SearchHit hit={hit} viewMode={viewMode} searchType={searchType} />
            )}
            classNames={{
              root: 'space-y-4',
              list: viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }}
          />

          {/* Pagination */}
          <div className="flex justify-center pt-8">
            <Pagination
              classNames={{
                root: 'flex items-center gap-2',
                list: 'flex items-center gap-1',
                item: 'px-3 py-2 rounded-lg border border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                selectedItem: 'bg-purple-600 text-foreground border-purple-600',
                disabledItem: 'opacity-50 cursor-not-allowed',
                firstPageItem: 'hidden',
                lastPageItem: 'hidden',
                previousPageItem: 'flex items-center gap-1',
                nextPageItem: 'flex items-center gap-1'
              }}
            />
          </div>
        </div>
      </InstantSearch>
    </div>
  )
}

// Search hit component
function SearchHit({ hit, viewMode, searchType }: {
  hit: any,
  viewMode: ViewMode,
  searchType: SearchType
}) {
  const getContentIcon = () => {
    if (hit.content_type?.includes('show') || hit.url?.includes('/shows/')) {
      return <PlayCircle className="w-5 h-5 text-purple-400" />
    }
    if (hit.content_type?.includes('artist') || hit.url?.includes('/profiles/')) {
      return <Users className="w-5 h-5 text-blue-400" />
    }
    if (hit.content_type?.includes('article') || hit.url?.includes('/blog/')) {
      return <FileText className="w-5 h-5 text-green-400" />
    }
    return <Music className="w-5 h-5 text-orange-400" />
  }

  const getContentType = () => {
    if (hit.content_type) {
      return hit.content_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    if (hit.url?.includes('/shows/')) return 'Show'
    if (hit.url?.includes('/profiles/')) return 'Artist Profile'
    if (hit.url?.includes('/blog/')) return 'Blog Post'
    return 'Page'
  }

  // Extract meaningful title from various possible fields
  const getImageUrl = () => {
    // For archive tracks, use mixcloud picture
    if (hit.content_type === 'archive_track' && hit.mixcloud_picture) {
      return hit.mixcloud_picture
    }

    // For content, use Storyblok images
    if (hit.image) {
      return hit.image
    }

    // Check for featured_image field (common in Storyblok)
    if (hit.featured_image?.filename) {
      return hit.featured_image.filename
    }

    // Additional image field checks
    if (hit.cover_image) {
      return hit.cover_image
    }

    if (hit.artist_photo) {
      return hit.artist_photo
    }

    // For live songs, we could add Spotify/album artwork later
    if (hit.content_type === 'live_song') {
      // Placeholder for album artwork - could integrate with Spotify API
      return null
    }

    return null
  }

  const getDisplayTitle = () => {
    // For live songs, prioritize song and artist fields
    if (hit.content_type === 'live_song') {
      if (hit.song && hit.artist) {
        return `${hit.song} - ${hit.artist}`
      }
      if (hit.song) {
        return hit.song
      }
      if (hit.artist) {
        return hit.artist
      }
    }

    // For archive tracks, prioritize track and artist fields
    if (hit.content_type === 'archive_track') {
      if (hit.track && hit.artist) {
        return `${hit.track} - ${hit.artist}`
      }
      if (hit.track) {
        return hit.track
      }
    }

    // For songs in general, prioritize music-specific fields
    if (searchType === 'songs' || hit.type === 'song' || hit.track_title) {
      const songTitles = [
        hit.track_title,
        hit.song_title,
        hit.track,
        hit.song,
        `${hit.artist} - ${hit.title}`.replace(' - undefined', '').replace('undefined - ', ''),
        hit.h1,
        hit.title
      ].filter(Boolean)

      if (songTitles[0] && !songTitles[0].includes('RHYTHM LAB')) {
        return songTitles[0]
      }
    }

    // Try to get a meaningful title from different fields
    const possibleTitles = [
      hit.h1,           // Main heading from page
      hit.heading,      // Alternative heading field
      hit.page_title,   // Page-specific title
      hit.article_title, // Article title
      hit.name,         // Name field
      hit.title         // Fallback to generic title
    ].filter(Boolean)

    // Use the first available title, or extract from URL as last resort
    let displayTitle = possibleTitles[0]

    // If we only have generic titles, try to extract from URL
    if (!displayTitle ||
        displayTitle.includes('RHYTHM LAB RADIO') ||
        displayTitle === 'Rhythm Lab Radio' ||
        displayTitle.includes('|')) {

      // Extract meaningful part from URL
      const urlParts = hit.url?.split('/').filter(Boolean) || []
      const lastPart = urlParts[urlParts.length - 1]

      if (lastPart) {
        // Convert URL slug to readable title
        displayTitle = lastPart
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
          .replace(/^\d+/, '') // Remove leading numbers/IDs
          .trim()
      }
    }

    // Clean up the title further
    if (displayTitle) {
      // Remove site name suffix
      displayTitle = displayTitle.replace(/\s*\|\s*RHYTHM LAB RADIO.*$/i, '')
      displayTitle = displayTitle.replace(/^RHYTHM LAB RADIO\s*\|\s*/i, '')

      // If still generic, try content field
      if (displayTitle.toLowerCase().includes('rhythm lab') && hit.content) {
        const contentStart = hit.content.substring(0, 100)
        const sentences = contentStart.split(/[.!?]/)
        if (sentences[0] && sentences[0].length > 10) {
          displayTitle = sentences[0].trim()
        }
      }
    }

    return displayTitle || 'Untitled Content'
  }

  const getTrackUrl = (hit: any) => {
    // For songs and tracks, create unified track page URLs
    if (hit.content_type === 'live_song' || hit.content_type === 'archive_track') {
      return `/track/${hit.objectID}`
    }

    // For other content, use original URL
    return hit.url || '#'
  }

  const imageUrl = getImageUrl()

  if (viewMode === 'list') {
    return (
      <Card className="bg-card border hover:bg-muted/50 transition-all duration-200 hover:border-primary/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {(hit.content_type === 'live_song' || hit.content_type === 'archive_track') ? (
                <TrackAlbumArt
                  trackId={hit.objectID}
                  artist={hit.artist}
                  song={hit.song || hit.track}
                  className="w-16 h-16 rounded-lg"
                />
              ) : imageUrl ? (
                <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-gray-800">
                  <Image
                    src={imageUrl}
                    alt={getDisplayTitle()}
                    fill
                    className="object-cover"
                    sizes="64px"
                    onError={(e) => {
                      console.warn('Image failed to load:', imageUrl)
                    }}
                  />
                </div>
              ) : (
                getContentIcon()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {getContentType()}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                {getDisplayTitle()}
              </h3>
              {hit.description && (
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  <span dangerouslySetInnerHTML={{ __html: hit._highlightResult?.description?.value || hit.description }} />
                </p>
              )}

              {/* Show date and time for live songs */}
              {hit.content_type === 'live_song' && (hit.date_display || hit.time_display) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {hit.date_display && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{hit.date_display}</span>
                    </div>
                  )}
                  {hit.time_display && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{hit.time_display}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <a
                  href={getTrackUrl(hit)}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  View Details →
                </a>
                {(hit.content_type === 'live_song' || hit.content_type === 'archive_track') && hit.artist && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Brain className="w-3 h-3" />
                    <span>AI Insights Available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border hover:bg-muted/50 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20">
      <CardContent className="p-0">
        {(hit.content_type === 'live_song' || hit.content_type === 'archive_track') ? (
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            <TrackAlbumArt
              trackId={hit.objectID}
              artist={hit.artist}
              song={hit.song || hit.track}
              className="w-full h-full"
            />
          </div>
        ) : imageUrl ? (
          <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-800">
            <Image
              src={imageUrl}
              alt={getDisplayTitle()}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                console.warn('Image failed to load:', imageUrl)
              }}
            />
          </div>
        ) : null}

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {getContentIcon()}
            <Badge variant="secondary" className="text-xs">
              {getContentType()}
            </Badge>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
            {getDisplayTitle()}
          </h3>

        {hit.description && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            <span dangerouslySetInnerHTML={{ __html: hit._highlightResult?.description?.value || hit.description }} />
          </p>
        )}

        {/* Show date and time for live songs in grid view */}
        {hit.content_type === 'live_song' && (hit.date_display || hit.time_display) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            {hit.date_display && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{hit.date_display}</span>
              </div>
            )}
            {hit.time_display && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{hit.time_display}</span>
              </div>
            )}
          </div>
        )}

          <div className="flex items-center justify-between">
            <a
              href={getTrackUrl(hit)}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            {(hit.content_type === 'live_song' || hit.content_type === 'archive_track') && hit.artist && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Brain className="w-3 h-3 text-purple-400" />
                <span>AI</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Search stats component
function SearchStats() {
  const { results, isSearchStalled } = useInstantSearch()

  if (isSearchStalled) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        Searching...
      </div>
    )
  }

  if (!results) return null

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {results.nbHits.toLocaleString()} results found
        </div>
        {results.processingTimeMS && (
          <div>in {results.processingTimeMS}ms</div>
        )}
      </div>
      <div className="text-xs">
        Powered by Algolia
      </div>
    </div>
  )
}