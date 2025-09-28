"use client"

import React, { useState, useMemo } from 'react'
import { InstantSearchNext } from 'react-instantsearch-nextjs'
import { Configure } from 'react-instantsearch'
import { searchClient, INDICES, SEARCH_CONFIG } from '@/lib/algolia/client'
import type { SearchFilters } from '@/lib/algolia/types'

interface AlgoliaSearchContainerProps {
  children: React.ReactNode
  initialQuery?: string
  initialFilters?: SearchFilters
  indexName?: 'songs' | 'content'
  onStateChange?: (state: any) => void
}

export function AlgoliaSearchContainer({
  children,
  initialQuery = '',
  initialFilters = {},
  indexName = 'songs',
  onStateChange
}: AlgoliaSearchContainerProps) {
  const [searchState, setSearchState] = useState({
    query: initialQuery,
    page: 0,
    configure: {
      filters: '',
      facetFilters: [],
      numericFilters: []
    }
  })

  // Select the appropriate index
  const currentIndex = useMemo(() => {
    return indexName === 'songs' ? INDICES.SONGS : INDICES.CONTENT
  }, [indexName])

  // Convert filters to Algolia format
  const algoliaFilters = useMemo(() => {
    const filters: string[] = []
    const facetFilters: string[][] = []
    const numericFilters: string[] = []

    if (initialFilters.genre && initialFilters.genre.length > 0) {
      facetFilters.push(initialFilters.genre.map(g => `genre:${g}`))
    }

    if (initialFilters.mood && initialFilters.mood.length > 0) {
      facetFilters.push(initialFilters.mood.map(m => `mood:${m}`))
    }

    if (initialFilters.content_type && initialFilters.content_type.length > 0) {
      facetFilters.push(initialFilters.content_type.map(ct => `content_type:${ct}`))
    }

    if (initialFilters.timeframe && initialFilters.timeframe.length > 0) {
      facetFilters.push(initialFilters.timeframe.map(tf => `timeframe:${tf}`))
    }

    if (initialFilters.has_artwork !== undefined) {
      filters.push(`has_artwork:${initialFilters.has_artwork}`)
    }

    if (initialFilters.ai_generated !== undefined) {
      filters.push(`ai_generated:${initialFilters.ai_generated}`)
    }

    if (initialFilters.year && initialFilters.year.length > 0) {
      const yearFilters = initialFilters.year.map(y => `year:${y}`)
      numericFilters.push(...yearFilters)
    }

    if (initialFilters.date_range) {
      const { start, end } = initialFilters.date_range
      if (indexName === 'songs') {
        numericFilters.push(`show_date >= ${new Date(start).getTime()}`)
        numericFilters.push(`show_date <= ${new Date(end).getTime()}`)
      } else {
        numericFilters.push(`publish_date >= ${new Date(start).getTime()}`)
        numericFilters.push(`publish_date <= ${new Date(end).getTime()}`)
      }
    }

    return {
      filters: filters.join(' AND '),
      facetFilters,
      numericFilters
    }
  }, [initialFilters, indexName])

  // Handle search state changes
  const handleSearchStateChange = (state: any) => {
    setSearchState(state)
    onStateChange?.(state)
  }

  // Configure search parameters based on index type
  const searchConfig = useMemo(() => {
    const baseConfig = {
      ...SEARCH_CONFIG,
      filters: algoliaFilters.filters,
      facetFilters: algoliaFilters.facetFilters,
      numericFilters: algoliaFilters.numericFilters
    }

    if (indexName === 'songs') {
      return {
        ...baseConfig,
        facets: [
          'genre',
          'mood',
          'year',
          'album',
          'show_date',
          'timeframe',
          'has_artwork',
          'ai_enhanced'
        ]
      }
    } else {
      return {
        ...baseConfig,
        facets: [
          'content_type',
          'category',
          'tags',
          'publish_date',
          'author',
          'ai_generated',
          'genre',
          'mood'
        ]
      }
    }
  }, [algoliaFilters, indexName])

  if (!searchClient) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Search functionality is not available.</p>
        <p className="text-sm">Please check your Algolia configuration.</p>
      </div>
    )
  }

  return (
    <InstantSearchNext
      searchClient={searchClient}
      indexName={currentIndex}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure {...searchConfig} />
      {children}
    </InstantSearchNext>
  )
}

// Context for sharing search state across components
interface SearchContextValue {
  indexName: 'songs' | 'content'
  setIndexName: (index: 'songs' | 'content') => void
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const SearchContext = React.createContext<SearchContextValue | null>(null)

export function SearchProvider({
  children,
  initialIndex = 'songs'
}: {
  children: React.ReactNode
  initialIndex?: 'songs' | 'content'
}) {
  const [indexName, setIndexName] = useState<'songs' | 'content'>(initialIndex)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [isLoading, setIsLoading] = useState(false)

  const value = useMemo(() => ({
    indexName,
    setIndexName,
    filters,
    setFilters,
    isLoading,
    setIsLoading
  }), [indexName, filters, isLoading])

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = React.useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

// Multi-index search container for searching across both indices
export function MultiIndexSearchContainer({
  children,
  initialQuery = '',
  onStateChange
}: {
  children: React.ReactNode
  initialQuery?: string
  onStateChange?: (state: any) => void
}) {
  const [searchState, setSearchState] = useState({
    query: initialQuery,
    indices: {
      [INDICES.SONGS]: {
        page: 0,
        configure: {
          hitsPerPage: 10,
          facets: ['genre', 'mood', 'year', 'artist', 'album'],
          attributesToRetrieve: ['*'],
          attributesToHighlight: ['title', 'artist', 'album']
        }
      },
      [INDICES.CONTENT]: {
        page: 0,
        configure: {
          hitsPerPage: 10,
          facets: ['content_type', 'category', 'tags', 'author'],
          attributesToRetrieve: ['*'],
          attributesToHighlight: ['title', 'excerpt', 'content']
        }
      }
    }
  })

  const handleSearchStateChange = (state: any) => {
    setSearchState(state)
    onStateChange?.(state)
  }

  if (!searchClient) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Search functionality is not available.</p>
        <p className="text-sm">Please check your Algolia configuration.</p>
      </div>
    )
  }

  return (
    <InstantSearchNext
      searchClient={searchClient}
      indexName={INDICES.SONGS} // Primary index
      initialUiState={{
        [INDICES.SONGS]: {
          query: initialQuery,
          page: 0
        },
        [INDICES.CONTENT]: {
          query: initialQuery,
          page: 0
        }
      }}
      onStateChange={handleSearchStateChange}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      {children}
    </InstantSearchNext>
  )
}

// Advanced multi-index search with better state management
export function UnifiedMultiIndexSearch({
  children,
  initialQuery = '',
  onStateChange,
  maxResultsPerIndex = 6
}: {
  children: React.ReactNode
  initialQuery?: string
  onStateChange?: (state: any) => void
  maxResultsPerIndex?: number
}) {
  if (!searchClient) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Search functionality is not available.</p>
        <p className="text-sm">Please check your Algolia configuration.</p>
      </div>
    )
  }

  return (
    <InstantSearchNext
      searchClient={searchClient}
      indexName={INDICES.SONGS}
      initialUiState={{
        [INDICES.SONGS]: {
          query: initialQuery,
          configure: {
            hitsPerPage: maxResultsPerIndex,
            facets: ['genre', 'mood', 'year', 'artist', 'album', 'has_artwork'],
            attributesToRetrieve: ['*'],
            attributesToHighlight: ['title', 'artist', 'album'],
            typoTolerance: true,
            removeWordsIfNoResults: 'allOptional'
          }
        },
        [INDICES.CONTENT]: {
          query: initialQuery,
          configure: {
            hitsPerPage: maxResultsPerIndex,
            facets: ['content_type', 'category', 'tags', 'author', 'ai_generated'],
            attributesToRetrieve: ['*'],
            attributesToHighlight: ['title', 'excerpt', 'content'],
            typoTolerance: true,
            removeWordsIfNoResults: 'allOptional'
          }
        }
      }}
      onStateChange={onStateChange}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      {children}
    </InstantSearchNext>
  )
}