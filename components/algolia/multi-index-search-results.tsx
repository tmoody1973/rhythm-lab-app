"use client"

import React from 'react'
import { useHits, useStats } from 'react-instantsearch'
import { Music, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchResults } from './search-results'
import { INDICES } from '@/lib/algolia/client'
import { cn } from '@/lib/utils'

interface MultiIndexSearchResultsProps {
  viewMode?: 'grid' | 'list'
  maxResultsPerIndex?: number
  showViewAllButtons?: boolean
  className?: string
}

export function MultiIndexSearchResults({
  viewMode = 'grid',
  maxResultsPerIndex = 6,
  showViewAllButtons = true,
  className
}: MultiIndexSearchResultsProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Songs Results Section */}
      <SongsIndexResults
        viewMode={viewMode}
        maxResults={maxResultsPerIndex}
        showViewAll={showViewAllButtons}
      />

      {/* Content Results Section */}
      <ContentIndexResults
        viewMode={viewMode}
        maxResults={maxResultsPerIndex}
        showViewAll={showViewAllButtons}
      />
    </div>
  )
}

// Songs index results component
function SongsIndexResults({
  viewMode,
  maxResults,
  showViewAll
}: {
  viewMode: 'grid' | 'list'
  maxResults: number
  showViewAll: boolean
}) {
  return (
    <SongsResultsContent
      viewMode={viewMode}
      maxResults={maxResults}
      showViewAll={showViewAll}
    />
  )
}

// Content index results component
function ContentIndexResults({
  viewMode,
  maxResults,
  showViewAll
}: {
  viewMode: 'grid' | 'list'
  maxResults: number
  showViewAll: boolean
}) {
  return (
    <ContentResultsContent
      viewMode={viewMode}
      maxResults={maxResults}
      showViewAll={showViewAll}
    />
  )
}

// Songs results content
function SongsResultsContent({
  viewMode,
  maxResults,
  showViewAll
}: {
  viewMode: 'grid' | 'list'
  maxResults: number
  showViewAll: boolean
}) {
  const { hits } = useHits({ indexName: INDICES.SONGS })
  const { nbHits, processingTimeMS } = useStats({ indexName: INDICES.SONGS })

  if (hits.length === 0) {
    return (
      <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-[#a1a1aa] py-8">
            <div className="text-center">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No songs found</p>
              <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#b12e2e] to-[#8b5cf6] rounded-lg flex items-center justify-center">
              <Music className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Songs</CardTitle>
              <p className="text-[#a1a1aa] text-sm">
                {nbHits.toLocaleString()} tracks found
                <span className="ml-2 opacity-60">• {processingTimeMS}ms</span>
              </p>
            </div>
          </div>

          {showViewAll && nbHits > maxResults && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
              onClick={() => {
                // Navigate to songs search page with current query
                const currentQuery = new URLSearchParams(window.location.search).get('q') || ''
                window.location.href = `/search?type=songs&q=${encodeURIComponent(currentQuery)}`
              }}
            >
              View All Songs
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <SearchResults
          searchType="songs"
          viewMode={viewMode}
          maxResults={maxResults}
          showPagination={false}
          usePagination={false}
        />
      </CardContent>
    </Card>
  )
}

// Content results content
function ContentResultsContent({
  viewMode,
  maxResults,
  showViewAll
}: {
  viewMode: 'grid' | 'list'
  maxResults: number
  showViewAll: boolean
}) {
  const { hits } = useHits({ indexName: INDICES.CONTENT })
  const { nbHits, processingTimeMS } = useStats({ indexName: INDICES.CONTENT })

  if (hits.length === 0) {
    return (
      <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-[#a1a1aa] py-8">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content found</p>
              <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group content by type for better organization
  const contentByType = React.useMemo(() => {
    const grouped = hits.reduce((acc: any, hit: any) => {
      const type = hit.content_type || 'other'
      if (!acc[type]) acc[type] = []
      acc[type].push(hit)
      return acc
    }, {})

    return grouped
  }, [hits])

  const contentTypeLabels = {
    show: 'Shows',
    artist_profile: 'Artist Profiles',
    blog_post: 'Blog Posts',
    deep_dive: 'Deep Dives',
    playlist: 'Playlists',
    episode: 'Episodes',
    other: 'Other'
  }

  return (
    <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#8b5cf6] to-[#b12e2e] rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Content</CardTitle>
              <p className="text-[#a1a1aa] text-sm">
                {nbHits.toLocaleString()} articles found
                <span className="ml-2 opacity-60">• {processingTimeMS}ms</span>
              </p>
            </div>
          </div>

          {/* Content type breakdown */}
          <div className="flex items-center gap-1">
            {Object.entries(contentByType).map(([type, items]) => (
              <Badge
                key={type}
                variant="outline"
                className="border-[#2a2f3e] text-[#a1a1aa] text-xs"
              >
                {contentTypeLabels[type as keyof typeof contentTypeLabels] || type}: {(items as any[]).length}
              </Badge>
            ))}
          </div>

          {showViewAll && nbHits > maxResults && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
              onClick={() => {
                // Navigate to content search page with current query
                const currentQuery = new URLSearchParams(window.location.search).get('q') || ''
                window.location.href = `/search?type=content&q=${encodeURIComponent(currentQuery)}`
              }}
            >
              View All Content
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <SearchResults
          searchType="content"
          viewMode={viewMode}
          maxResults={maxResults}
          showPagination={false}
          usePagination={false}
        />
      </CardContent>
    </Card>
  )
}

// Search insights component for multi-index search
export function MultiIndexSearchInsights() {
  const songsStats = useStats({ indexName: INDICES.SONGS })
  const contentStats = useStats({ indexName: INDICES.CONTENT })

  const totalResults = songsStats.nbHits + contentStats.nbHits
  const totalTime = Math.max(songsStats.processingTimeMS, contentStats.processingTimeMS)

  if (totalResults === 0) return null

  return (
    <div className="bg-[#0a0e1a] border border-[#2a2f3e] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#b12e2e]" />
            <span className="text-white font-medium">Search Results</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-[#a1a1aa]">
            <div className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              <span>{songsStats.nbHits.toLocaleString()} songs</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{contentStats.nbHits.toLocaleString()} articles</span>
            </div>
            <div>
              Total: {totalResults.toLocaleString()} results
            </div>
          </div>
        </div>

        <div className="text-sm text-[#a1a1aa]">
          {totalTime}ms
        </div>
      </div>
    </div>
  )
}

// Hook for managing multi-index search state
export function useMultiIndexSearch() {
  const songsHits = useHits({ indexName: INDICES.SONGS })
  const contentHits = useHits({ indexName: INDICES.CONTENT })
  const songsStats = useStats({ indexName: INDICES.SONGS })
  const contentStats = useStats({ indexName: INDICES.CONTENT })

  return {
    songs: {
      hits: songsHits.hits,
      nbHits: songsStats.nbHits,
      processingTime: songsStats.processingTimeMS
    },
    content: {
      hits: contentHits.hits,
      nbHits: contentStats.nbHits,
      processingTime: contentStats.processingTimeMS
    },
    total: {
      hits: songsHits.hits.length + contentHits.hits.length,
      nbHits: songsStats.nbHits + contentStats.nbHits,
      processingTime: Math.max(songsStats.processingTimeMS, contentStats.processingTimeMS)
    }
  }
}