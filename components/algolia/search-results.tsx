"use client"

import React, { useEffect } from 'react'
import { useHits, useStats } from 'react-instantsearch'
import { SearchPagination, InfiniteScrollResults } from './search-pagination'
import { trackResultClick, trackResultView } from '@/lib/algolia/analytics'
import { Music, Archive, BookOpen, User, Play, Clock, Calendar, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { SongSearchResult, ContentSearchResult } from '@/lib/algolia/types'
import { cn } from '@/lib/utils'
import { InfluenceGraph } from '@/components/influence-graph'

interface SearchResultsProps {
  searchType?: 'songs' | 'content' | 'mixed'
  viewMode?: 'grid' | 'list'
  maxResults?: number
  showPagination?: boolean
  isLoading?: boolean
  onResultClick?: (result: any) => void
  className?: string
  usePagination?: boolean
  useInfiniteScroll?: boolean
}

export function SearchResults({
  searchType = 'mixed',
  viewMode = 'grid',
  maxResults,
  showPagination = true,
  isLoading = false,
  onResultClick,
  className,
  usePagination = true,
  useInfiniteScroll = false
}: SearchResultsProps) {
  const { hits } = useHits()
  const { nbHits, processingTimeMS } = useStats()

  // Apply max results filter if specified
  const displayHits = maxResults ? hits.slice(0, maxResults) : hits

  // Track result views
  useEffect(() => {
    if (hits.length > 0) {
      const objectIDs = hits.map((hit: any) => hit.objectID)
      trackResultView(objectIDs, '', '') // You'd need to get queryID from context
    }
  }, [hits])

  if (isLoading) {
    return <SearchLoadingState />
  }

  if (hits.length === 0) {
    return <EmptySearchResults />
  }

  const handleResultClick = (result: any, index: number) => {
    trackResultClick(result.objectID, index, '', '') // You'd need to get queryID from context
    onResultClick?.(result)
  }

  const resultsContent = (
    <div className={cn(
      viewMode === 'grid'
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "space-y-3"
    )}>
      {displayHits.map((hit: any, index) => (
        <SearchResultItem
          key={hit.objectID}
          result={hit}
          index={index}
          searchType={searchType}
          viewMode={viewMode}
          onClick={() => handleResultClick(hit, index)}
        />
      ))}
    </div>
  )

  if (useInfiniteScroll) {
    return (
      <div className={cn("space-y-4", className)}>
        <SearchStats resultCount={nbHits} processingTime={processingTimeMS} />
        <InfiniteScrollResults>
          {resultsContent}
        </InfiniteScrollResults>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <SearchStats resultCount={nbHits} processingTime={processingTimeMS} />
      {resultsContent}
      {usePagination && <SearchPagination />}
    </div>
  )
}

// Individual search result item
interface SearchResultItemProps {
  result: SongSearchResult | ContentSearchResult
  index: number
  searchType: 'songs' | 'content' | 'mixed'
  viewMode?: 'grid' | 'list'
  onClick?: () => void
}

function SearchResultItem({ result, index, searchType, viewMode = 'list', onClick }: SearchResultItemProps) {
  // Determine result type from data if mixed
  const itemType = searchType === 'mixed'
    ? (result as any).content_type ? 'content' : 'song'
    : searchType === 'songs' ? 'song' : 'content'

  if (itemType === 'song') {
    return <SongResultItem result={result as SongSearchResult} index={index} onClick={onClick} />
  } else {
    return <ContentResultItem result={result as ContentSearchResult} index={index} onClick={onClick} />
  }
}

// Song result component
function SongResultItem({
  result,
  index,
  onClick
}: {
  result: SongSearchResult
  index: number
  onClick?: () => void
}) {
  // Parse highlighted content
  const highlightedTitle = result._highlightResult?.title?.value || result.title
  const highlightedArtist = result._highlightResult?.artist?.value || result.artist
  const highlightedAlbum = result._highlightResult?.album?.value || result.album

  // Handle play action - this would integrate with your audio player
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Integrate with podcast player or audio system
    console.log('Playing:', result.title, 'by', result.artist)

    // Example integration with a global audio player context
    // playTrack({
    //   id: result.objectID,
    //   title: result.title,
    //   artist: result.artist,
    //   artwork: result.artwork_url,
    //   url: result.mixcloud_url || result.spotify_url
    // })
  }

  // Format show date for better display
  const formatShowDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Calculate time ago for show date
  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (days === 0) return 'Today'
      if (days === 1) return 'Yesterday'
      if (days < 7) return `${days} days ago`
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`
      if (days < 365) return `${Math.floor(days / 30)} months ago`
      return `${Math.floor(days / 365)} years ago`
    } catch {
      return ''
    }
  }

  return (
    <Card
      className="p-4 bg-[#0a0e1a] border-[#2a2f3e] hover:border-[#b12e2e] cursor-pointer transition-all duration-200 hover:shadow-lg group"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Enhanced Artwork with Loading State */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-[#b12e2e] to-[#8b5cf6] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {result.artwork_url ? (
            <>
              <img
                src={result.artwork_url}
                alt={`${result.title} artwork`}
                className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-[#b12e2e] to-[#8b5cf6] rounded-lg hidden items-center justify-center">
                <Music className="h-8 w-8 text-white" />
              </div>
            </>
          ) : (
            <Music className="h-8 w-8 text-white" />
          )}

          {/* Overlay play button on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-8 h-8 bg-[#b12e2e] rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-white font-medium truncate text-lg group-hover:text-[#b12e2e] transition-colors"
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />
            {result.ai_enhanced && (
              <Badge className="bg-[#8b5cf6] text-white text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
            <Badge variant="outline" className="border-[#2a2f3e] text-[#a1a1aa] text-xs">
              Track
            </Badge>
          </div>

          <div className="text-[#a1a1aa] text-sm space-y-1">
            <div
              className="font-medium"
              dangerouslySetInnerHTML={{ __html: highlightedArtist }}
            />
            {result.album && (
              <div className="flex items-center gap-1">
                <span>from</span>
                <span
                  className="italic"
                  dangerouslySetInnerHTML={{ __html: highlightedAlbum || result.album }}
                />
                {result.year && (
                  <span className="text-[#666]">({result.year})</span>
                )}
              </div>
            )}

            {/* Enhanced metadata row */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              {result.show_title && (
                <div className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  <span className="truncate max-w-32">{result.show_title}</span>
                </div>
              )}
              {result.show_date && (
                <div className="flex items-center gap-1" title={formatShowDate(result.show_date)}>
                  <Calendar className="h-3 w-3" />
                  <span>{getTimeAgo(result.show_date)}</span>
                </div>
              )}
              {result.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(result.duration)}
                </div>
              )}
              {result.bpm && (
                <div className="flex items-center gap-1">
                  <span className="font-mono">{result.bpm} BPM</span>
                </div>
              )}
              {result.key && (
                <div className="flex items-center gap-1">
                  <span className="font-mono">{result.key}</span>
                </div>
              )}
            </div>

            {/* Energy and danceability indicators */}
            {(result.energy_level || result.danceability) && (
              <div className="flex items-center gap-3 text-xs mt-1">
                {result.energy_level && (
                  <div className="flex items-center gap-1">
                    <span>Energy:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-2 rounded-full",
                            i < result.energy_level! ? "bg-[#b12e2e]" : "bg-[#2a2f3e]"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {result.danceability && (
                  <div className="flex items-center gap-1">
                    <span>Dance:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-2 rounded-full",
                            i < result.danceability! ? "bg-[#8b5cf6]" : "bg-[#2a2f3e]"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Tags */}
          {(result.genre?.length || result.mood?.length || result.tags?.length) && (
            <div className="flex flex-wrap gap-1 mt-3">
              {result.genre?.slice(0, 3).map((genre, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-[#2a2f3e] text-[#a1a1aa] text-xs hover:border-[#b12e2e] hover:text-[#b12e2e] cursor-pointer transition-colors"
                >
                  {genre}
                </Badge>
              ))}
              {result.mood?.slice(0, 2).map((mood, i) => (
                <Badge
                  key={`mood-${i}`}
                  variant="outline"
                  className="border-[#8b5cf6] text-[#8b5cf6] text-xs hover:bg-[#8b5cf6] hover:text-white cursor-pointer transition-colors"
                >
                  {mood}
                </Badge>
              ))}
              {result.tags?.slice(0, 2).map((tag, i) => (
                <Badge
                  key={`tag-${i}`}
                  variant="outline"
                  className="border-[#666] text-[#666] text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Artist Influence Graph - only show if has collaborations */}
          {result.has_collaborations && (
            <div className="mt-3">
              <InfluenceGraph trackData={{
                track: result.title || result.track || '',
                artist: result.artist || '',
                featured_artists: result.featured_artists || [],
                remixers: result.remixers || [],
                producers: result.producers || [],
                collaborators: result.collaborators || [],
                related_artists: result.related_artists || [],
                has_collaborations: result.has_collaborations || false,
                collaboration_count: result.collaboration_count || 0
              }} />
            </div>
          )}
        </div>

        {/* Enhanced Actions */}
        <div className="flex flex-col items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-[#b12e2e] hover:text-white hover:bg-[#b12e2e] w-10 h-10 p-0 rounded-full"
            onClick={handlePlay}
            title="Play track"
          >
            <Play className="h-5 w-5" />
          </Button>

          {/* External links */}
          <div className="flex gap-1">
            {result.spotify_url && (
              <Button
                size="sm"
                variant="ghost"
                className="text-[#1db954] hover:text-white hover:bg-[#1db954] w-8 h-8 p-0 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(result.spotify_url, '_blank')
                }}
                title="Open in Spotify"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            {result.youtube_url && (
              <Button
                size="sm"
                variant="ghost"
                className="text-[#ff0000] hover:text-white hover:bg-[#ff0000] w-8 h-8 p-0 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(result.youtube_url, '_blank')
                }}
                title="Open in YouTube"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            {result.discogs_url && (
              <Button
                size="sm"
                variant="ghost"
                className="text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e] w-8 h-8 p-0 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(result.discogs_url, '_blank')
                }}
                title="View on Discogs"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            {result.mixcloud_url && (
              <Button
                size="sm"
                variant="ghost"
                className="text-[#314359] hover:text-white hover:bg-[#314359] w-8 h-8 p-0 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(result.mixcloud_url, '_blank')
                }}
                title="Listen on Mixcloud"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// Content result component
function ContentResultItem({
  result,
  index,
  onClick
}: {
  result: ContentSearchResult
  index: number
  onClick?: () => void
}) {
  // Parse highlighted content
  const highlightedTitle = result._highlightResult?.title?.value || result.title
  const highlightedExcerpt = result._highlightResult?.excerpt?.value || result.excerpt

  // Get appropriate icon
  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'show':
      case 'episode':
        return Archive
      case 'artist_profile':
        return User
      case 'blog_post':
      case 'deep_dive':
        return BookOpen
      default:
        return BookOpen
    }
  }

  const Icon = getContentIcon(result.content_type || 'article')

  return (
    <Card
      className="p-4 bg-[#0a0e1a] border-[#2a2f3e] hover:border-[#b12e2e] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Featured Image or Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-[#b12e2e] to-[#8b5cf6] rounded-lg flex items-center justify-center flex-shrink-0">
          {result.featured_image ? (
            <img
              src={result.featured_image}
              alt={`${result.title} image`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Icon className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-white font-medium truncate"
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />
            {result.ai_generated && (
              <Badge className="bg-[#8b5cf6] text-white text-xs">AI</Badge>
            )}
            <Badge variant="outline" className="border-[#2a2f3e] text-[#a1a1aa] text-xs capitalize">
              {result.content_type ? result.content_type.replace('_', ' ') : 'content'}
            </Badge>
          </div>

          {highlightedExcerpt && (
            <div
              className="text-[#a1a1aa] text-sm mb-2 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
            />
          )}

          <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
            {result.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {result.author}
              </div>
            )}
            {result.publish_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(result.publish_date).toLocaleDateString()}
              </div>
            )}
            {result.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(result.duration)}
              </div>
            )}
            {result.view_count && (
              <div>{result.view_count.toLocaleString()} views</div>
            )}
          </div>

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.tags.slice(0, 4).map((tag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-[#2a2f3e] text-[#a1a1aa] text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-[#b12e2e] hover:text-white hover:bg-[#b12e2e] text-sm"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-[#a1a1aa] hover:text-white hover:bg-[#2a2f3e]"
            onClick={(e) => {
              e.stopPropagation()
              window.open(result.url, '_blank')
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Search statistics component
function SearchStats({
  resultCount,
  processingTime
}: {
  resultCount: number
  processingTime: number
}) {
  return (
    <div className="flex items-center justify-between text-sm text-[#a1a1aa] pb-4 border-b border-[#2a2f3e]">
      <span>
        {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{processingTime}ms</span>
      </div>
    </div>
  )
}

// Empty state component
function EmptySearchResults() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-br from-[#b12e2e] to-[#8b5cf6] rounded-full flex items-center justify-center mx-auto mb-4">
        <Music className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-white text-lg font-medium mb-2">No results found</h3>
      <p className="text-[#a1a1aa] mb-4">
        Try adjusting your search terms or filters
      </p>
      <div className="text-sm text-[#a1a1aa]">
        <p>Search tips:</p>
        <ul className="mt-2 space-y-1">
          <li>• Use specific artist or track names</li>
          <li>• Try different genres or moods</li>
          <li>• Check your spelling</li>
          <li>• Use fewer filters</li>
        </ul>
      </div>
    </div>
  )
}

// Loading state component
function SearchLoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[#a1a1aa] pb-4 border-b border-[#2a2f3e]">
        <div className="w-24 h-4 bg-[#2a2f3e] rounded animate-pulse" />
        <div className="w-16 h-4 bg-[#2a2f3e] rounded animate-pulse" />
      </div>

      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="p-4 bg-[#0a0e1a] border-[#2a2f3e]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2a2f3e] rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-[#2a2f3e] rounded animate-pulse" />
              <div className="w-1/2 h-3 bg-[#2a2f3e] rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="w-16 h-6 bg-[#2a2f3e] rounded animate-pulse" />
                <div className="w-20 h-6 bg-[#2a2f3e] rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-[#2a2f3e] rounded animate-pulse" />
              <div className="w-8 h-8 bg-[#2a2f3e] rounded animate-pulse" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Utility function to format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}