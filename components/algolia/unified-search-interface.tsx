"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music, FileText, Users, Headphones, Filter, Grid, List } from 'lucide-react'
import { AlgoliaSearchContainer, MultiIndexSearchContainer, UnifiedMultiIndexSearch } from './algolia-search-container'
import { SearchInput } from './search-input'
import { SearchFilters } from './search-filters'
import { SearchResults } from './search-results'
import { FacetedSearch } from './faceted-search'
import { MultiIndexSearchResults, MultiIndexSearchInsights } from './multi-index-search-results'
import type { SearchFilters as SearchFiltersType } from '@/lib/algolia/types'

type SearchType = 'all' | 'songs' | 'content'
type ViewMode = 'grid' | 'list'

interface UnifiedSearchInterfaceProps {
  initialQuery?: string
  initialSearchType?: string
}

export function UnifiedSearchInterface({
  initialQuery = '',
  initialSearchType = 'all'
}: UnifiedSearchInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchType, setSearchType] = useState<SearchType>(
    ['all', 'songs', 'content'].includes(initialSearchType)
      ? initialSearchType as SearchType
      : 'all'
  )
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFiltersType>({})
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (searchType !== 'all') params.set('type', searchType)

    const url = `/search${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(url, { scroll: false })
  }, [query, searchType, router])

  // Handle query changes
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
  }

  // Handle search type changes
  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type)
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters)
  }

  // Search type configurations
  const searchTypeConfig = {
    all: {
      icon: Grid,
      label: 'All Results',
      description: 'Songs, shows, artists, and content'
    },
    songs: {
      icon: Music,
      label: 'Songs',
      description: 'Tracks from live streams and shows'
    },
    content: {
      icon: FileText,
      label: 'Content',
      description: 'Shows, artists, blogs, and episodes'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        {/* Search Type Tabs */}
        <Tabs value={searchType} onValueChange={(value) => handleSearchTypeChange(value as SearchType)}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {Object.entries(searchTypeConfig).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>

              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Content */}
          <div className="mt-6">
            {searchType === 'all' ? (
              // Multi-index search for all content
              <UnifiedMultiIndexSearch
                initialQuery={query}
                onStateChange={(state) => setIsLoading(state.isSearchStalled)}
                maxResultsPerIndex={6}
              >
                <TabsContent value="all" className="space-y-6">
                  {/* Search Input */}
                  <div className="max-w-2xl">
                    <SearchInput
                      placeholder="Search songs, artists, shows, or content..."
                      autoFocus={!initialQuery}
                      onQueryChange={handleQueryChange}
                      showSuggestions={true}
                    />
                  </div>

                  {/* Search insights */}
                  <MultiIndexSearchInsights />

                  {showFilters && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Search Filters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-white mb-3">Songs</h4>
                            <FacetedSearch
                              searchType="songs"
                              onFiltersChange={handleFiltersChange}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white mb-3">Content</h4>
                            <FacetedSearch
                              searchType="content"
                              onFiltersChange={handleFiltersChange}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Multi-index results */}
                  <MultiIndexSearchResults
                    viewMode={viewMode}
                    maxResultsPerIndex={6}
                    showViewAllButtons={true}
                  />
                </TabsContent>
              </UnifiedMultiIndexSearch>
            ) : (
              // Single index search for songs or content
              <AlgoliaSearchContainer
                indexName={searchType as 'songs' | 'content'}
                initialQuery={query}
                initialFilters={filters}
                onStateChange={(state) => setIsLoading(state.isSearchStalled)}
              >
                <TabsContent value={searchType} className="space-y-6">
                  {/* Search Input */}
                  <div className="max-w-2xl">
                    <SearchInput
                      placeholder={`Search ${searchType}...`}
                      autoFocus={!initialQuery}
                      onQueryChange={handleQueryChange}
                      showSuggestions={true}
                    />
                  </div>

                  {showFilters && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {searchTypeConfig[searchType].label} Filters
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SearchFilters
                          searchType={searchType}
                          onFiltersChange={handleFiltersChange}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Single index results */}
                  <SearchResults
                    searchType={searchType}
                    viewMode={viewMode}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </AlgoliaSearchContainer>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Multi-index results component
function MultiIndexResults({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="space-y-8">
      {/* Songs Section */}
      <AlgoliaSearchContainer indexName="songs">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Music className="h-5 w-5" />
              Songs
            </h3>
            <Button variant="outline" size="sm" asChild>
              <a href="/search?type=songs">View All Songs</a>
            </Button>
          </div>
          <SearchResults
            searchType="songs"
            viewMode={viewMode}
            maxResults={6}
            showPagination={false}
          />
        </div>
      </AlgoliaSearchContainer>

      {/* Content Section */}
      <AlgoliaSearchContainer indexName="content">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content
            </h3>
            <Button variant="outline" size="sm" asChild>
              <a href="/search?type=content">View All Content</a>
            </Button>
          </div>
          <SearchResults
            searchType="content"
            viewMode={viewMode}
            maxResults={6}
            showPagination={false}
          />
        </div>
      </AlgoliaSearchContainer>
    </div>
  )
}

// Quick search stats component
function SearchStats({ searchType }: { searchType: SearchType }) {
  // This would typically come from search results
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        Real-time search
      </div>
      <div>
        {searchType === 'all' ? 'Multi-index search' : `${searchType} index`}
      </div>
    </div>
  )
}