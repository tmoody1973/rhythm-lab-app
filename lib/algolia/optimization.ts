import { searchClient, INDICES } from './client'
import type { SearchFilters } from './types'

// Search result caching
class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  generateKey(query: string, filters: SearchFilters = {}, index: string): string {
    return `${index}:${query}:${JSON.stringify(filters)}`
  }

  set(key: string, data: any, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const searchCache = new SearchCache()

// Cleanup cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanup()
  }, 10 * 60 * 1000)
}

// Optimized search function with caching
export async function optimizedSearch(
  query: string,
  filters: SearchFilters = {},
  indexName: 'songs' | 'content' = 'songs',
  options: any = {}
) {
  const cacheKey = searchCache.generateKey(query, filters, indexName)

  // Try to get from cache first
  const cached = searchCache.get(cacheKey)
  if (cached) {
    console.log('🎯 Cache hit for search:', query)
    return cached
  }

  try {
    const index = searchClient.initIndex(
      indexName === 'songs' ? INDICES.SONGS : INDICES.CONTENT
    )

    // Prepare search parameters
    const searchParams = {
      query,
      filters: buildFiltersString(filters),
      facetFilters: buildFacetFilters(filters),
      numericFilters: buildNumericFilters(filters),
      hitsPerPage: options.hitsPerPage || 20,
      page: options.page || 0,
      attributesToRetrieve: options.attributesToRetrieve || ['*'],
      attributesToHighlight: options.attributesToHighlight || ['title', 'artist', 'content'],
      highlightPreTag: '<mark class="bg-red-500/20 text-red-200">',
      highlightPostTag: '</mark>',
      ...options
    }

    console.log('🔍 Performing search:', { query, indexName, filters })

    const result = await index.search('', searchParams)

    // Cache the result
    searchCache.set(cacheKey, result, 5 * 60 * 1000) // 5 minutes TTL

    return result
  } catch (error) {
    console.error('Search error:', error)
    throw error
  }
}

// Build filter string from SearchFilters
function buildFiltersString(filters: SearchFilters): string {
  const filterParts: string[] = []

  if (filters.has_artwork !== undefined) {
    filterParts.push(`has_artwork:${filters.has_artwork}`)
  }

  if (filters.ai_generated !== undefined) {
    filterParts.push(`ai_generated:${filters.ai_generated}`)
  }

  return filterParts.join(' AND ')
}

// Build facet filters from SearchFilters
function buildFacetFilters(filters: SearchFilters): string[][] {
  const facetFilters: string[][] = []

  if (filters.genre && filters.genre.length > 0) {
    facetFilters.push(filters.genre.map(g => `genre:${g}`))
  }

  if (filters.mood && filters.mood.length > 0) {
    facetFilters.push(filters.mood.map(m => `mood:${m}`))
  }

  if (filters.content_type && filters.content_type.length > 0) {
    facetFilters.push(filters.content_type.map(ct => `content_type:${ct}`))
  }

  if (filters.tags && filters.tags.length > 0) {
    facetFilters.push(filters.tags.map(t => `tags:${t}`))
  }

  if (filters.author && filters.author.length > 0) {
    facetFilters.push(filters.author.map(a => `author:${a}`))
  }

  return facetFilters
}

// Build numeric filters from SearchFilters
function buildNumericFilters(filters: SearchFilters): string[] {
  const numericFilters: string[] = []

  if (filters.year && filters.year.length > 0) {
    const yearFilters = filters.year.map(y => `year:${y}`)
    numericFilters.push(...yearFilters)
  }

  if (filters.date_range) {
    const { start, end } = filters.date_range
    const startTimestamp = new Date(start).getTime()
    const endTimestamp = new Date(end).getTime()

    numericFilters.push(`show_date >= ${startTimestamp}`)
    numericFilters.push(`show_date <= ${endTimestamp}`)
  }

  return numericFilters
}

// Debounced search function
export function createDebouncedSearch(delay = 300) {
  let timeoutId: NodeJS.Timeout

  return function debouncedSearch(
    query: string,
    filters: SearchFilters = {},
    indexName: 'songs' | 'content' = 'songs',
    options: any = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId)

      timeoutId = setTimeout(async () => {
        try {
          const result = await optimizedSearch(query, filters, indexName, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

// Search suggestions with caching
export async function getSearchSuggestions(
  query: string,
  indexName: 'songs' | 'content' = 'songs',
  limit = 5
): Promise<string[]> {
  if (query.length < 2) return []

  const cacheKey = `suggestions:${indexName}:${query}:${limit}`
  const cached = searchCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const index = searchClient.initIndex(
      indexName === 'songs' ? INDICES.SONGS : INDICES.CONTENT
    )

    const result = await index.search('', {
      query,
      hitsPerPage: limit,
      attributesToRetrieve: ['title', 'artist'],
      attributesToHighlight: [],
      analytics: false,
      enableABTest: false
    })

    const suggestions = result.hits.map((hit: any) => {
      if (indexName === 'songs') {
        return `${hit.title} by ${hit.artist}`
      } else {
        return hit.title
      }
    })

    // Cache suggestions for 10 minutes
    searchCache.set(cacheKey, suggestions, 10 * 60 * 1000)

    return suggestions
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return []
  }
}

// Performance monitoring
export class SearchPerformanceOptimizer {
  private queryTimes: number[] = []
  private slowQueries: Array<{ query: string; time: number; timestamp: Date }> = []

  recordQueryTime(query: string, startTime: number, endTime: number): void {
    const duration = endTime - startTime
    this.queryTimes.push(duration)

    // Keep only last 100 query times
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift()
    }

    // Track slow queries (>1000ms)
    if (duration > 1000) {
      this.slowQueries.push({
        query,
        time: duration,
        timestamp: new Date()
      })

      // Keep only last 20 slow queries
      if (this.slowQueries.length > 20) {
        this.slowQueries.shift()
      }
    }
  }

  getAverageQueryTime(): number {
    if (this.queryTimes.length === 0) return 0
    const sum = this.queryTimes.reduce((a, b) => a + b, 0)
    return sum / this.queryTimes.length
  }

  getSlowQueries(): Array<{ query: string; time: number; timestamp: Date }> {
    return this.slowQueries.slice()
  }

  getPerformanceReport(): {
    averageQueryTime: number
    totalQueries: number
    slowQueriesCount: number
    recentSlowQueries: Array<{ query: string; time: number; timestamp: Date }>
  } {
    return {
      averageQueryTime: this.getAverageQueryTime(),
      totalQueries: this.queryTimes.length,
      slowQueriesCount: this.slowQueries.length,
      recentSlowQueries: this.slowQueries.slice(-5)
    }
  }
}

// Global performance optimizer instance
export const performanceOptimizer = new SearchPerformanceOptimizer()

// Search result prefetching
export async function prefetchPopularSearches(): Promise<void> {
  const popularQueries = [
    'deep house',
    'jazz',
    'electronic',
    'ambient',
    'techno'
  ]

  try {
    // Prefetch popular searches
    await Promise.allSettled(
      popularQueries.map(query =>
        optimizedSearch(query, {}, 'songs', { hitsPerPage: 10 })
      )
    )

    console.log('✅ Popular searches prefetched')
  } catch (error) {
    console.error('Error prefetching popular searches:', error)
  }
}

// Auto-complete optimization
export const optimizedAutocomplete = createDebouncedSearch(150)

// Search result ranking optimization
export function optimizeRanking(results: any[], userPreferences: any = {}): any[] {
  return results.map((result, index) => {
    let score = result._rankingInfo?.nbTypos ? 100 - result._rankingInfo.nbTypos * 10 : 100

    // Boost AI-enhanced content if user prefers it
    if (userPreferences.preferAI && result.ai_enhanced) {
      score += 20
    }

    // Boost recent content
    const ageInDays = (Date.now() - new Date(result.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays < 30) {
      score += 10
    }

    // Boost content with artwork
    if (result.has_artwork) {
      score += 5
    }

    return {
      ...result,
      _optimizedScore: score,
      _originalIndex: index
    }
  }).sort((a, b) => b._optimizedScore - a._optimizedScore)
}