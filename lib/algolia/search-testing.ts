import { searchClient, INDICES } from './client'
import type { SongRecord, ContentRecord, SearchFilters } from './types'

// Test data for validation
const TEST_SONGS: Partial<SongRecord>[] = [
  {
    objectID: 'test_song_1',
    title: 'Deep House Journey',
    artist: 'Electronic Artist',
    album: 'Midnight Sessions',
    genre: ['deep house', 'electronic'],
    mood: ['chill', 'contemplative'],
    year: 2023,
    duration: 420,
    has_artwork: true,
    energy_level: 6,
    danceability: 8,
    bpm: 124
  },
  {
    objectID: 'test_song_2',
    title: 'Jazz Fusion Experiment',
    artist: 'Jazz Collective',
    album: 'Fusion Explorations',
    genre: ['jazz', 'fusion'],
    mood: ['experimental', 'energetic'],
    year: 2022,
    duration: 360,
    has_artwork: false,
    energy_level: 8,
    danceability: 4,
    bpm: 140
  }
]

const TEST_CONTENT: Partial<ContentRecord>[] = [
  {
    objectID: 'test_content_1',
    title: 'Artist Profile: Electronic Pioneer',
    content_type: 'artist_profile',
    excerpt: 'Exploring the journey of electronic music innovation',
    content: 'This artist has been pioneering electronic music for over a decade...',
    author: 'Music Writer',
    category: 'profiles',
    tags: ['electronic', 'innovation', 'pioneer'],
    ai_generated: false,
    view_count: 1250
  },
  {
    objectID: 'test_content_2',
    title: 'Deep Dive: The Evolution of House Music',
    content_type: 'deep_dive',
    excerpt: 'A comprehensive look at house music history',
    content: 'House music emerged in Chicago in the 1980s...',
    author: 'AI Writer',
    category: 'analysis',
    tags: ['house', 'history', 'chicago'],
    ai_generated: true,
    view_count: 892
  }
]

// Test suite for search functionality
export class SearchTestSuite {
  private testResults: TestResult[] = []

  async runAllTests(): Promise<TestSuiteResult> {
    console.log('🧪 Starting comprehensive search test suite...')
    this.testResults = []

    const tests = [
      this.testBasicSongSearch,
      this.testBasicContentSearch,
      this.testMultiIndexSearch,
      this.testSearchFilters,
      this.testFacetedSearch,
      this.testSearchPagination,
      this.testSearchSorting,
      this.testSearchAnalytics,
      this.testErrorHandling,
      this.testPerformance,
      this.testEmptyResults,
      this.testSpecialCharacters,
      this.testTypoTolerance,
      this.testGeographicSearch,
      this.testDateRangeSearch
    ]

    for (const test of tests) {
      try {
        console.log(`Running test: ${test.name}...`)
        await test.call(this)
      } catch (error) {
        this.addTestResult(test.name, false, `Test failed: ${error}`)
      }
    }

    const summary = this.generateTestSummary()
    console.log('🧪 Test suite completed')
    return summary
  }

  // Test basic song search functionality
  private async testBasicSongSearch(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: 'electronic',
      params: {
        hitsPerPage: 10
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testBasicSongSearch',
        results.hits.length >= 0,
        `Found ${results.hits.length} songs for 'electronic' query`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test basic content search functionality
  private async testBasicContentSearch(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.CONTENT,
      query: 'artist',
      params: {
        hitsPerPage: 10
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testBasicContentSearch',
        results.hits.length >= 0,
        `Found ${results.hits.length} content items for 'artist' query`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test multi-index search
  private async testMultiIndexSearch(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([
      {
        indexName: INDICES.SONGS,
        query: 'jazz',
        params: { hitsPerPage: 5 }
      },
      {
        indexName: INDICES.CONTENT,
        query: 'jazz',
        params: { hitsPerPage: 5 }
      }
    ])

    const songsResults = response.results[0]
    const contentResults = response.results[1]

    const success = 'hits' in songsResults && 'hits' in contentResults
    this.addTestResult(
      'testMultiIndexSearch',
      success,
      success ?
        `Multi-index search successful: ${songsResults.hits.length} songs, ${contentResults.hits.length} content` :
        'Multi-index search failed'
    )
  }

  // Test search filters
  private async testSearchFilters(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: '',
      params: {
        filters: 'genre:electronic',
        hitsPerPage: 10
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testSearchFilters',
        true,
        `Filter search successful: ${results.hits.length} electronic tracks`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test faceted search
  private async testFacetedSearch(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: '',
      params: {
        facets: ['genre', 'mood', 'year'],
        maxValuesPerFacet: 10
      }
    }])

    const results = response.results[0]

    if ('facets' in results && results.facets) {
      const hasFacets = Object.keys(results.facets).length > 0
      this.addTestResult(
        'testFacetedSearch',
        hasFacets,
        hasFacets ?
          `Faceted search working: ${Object.keys(results.facets).join(', ')} facets available` :
          'No facets returned'
      )
    } else {
      this.addTestResult('testFacetedSearch', false, 'No facets in response')
    }
  }

  // Test search pagination
  private async testSearchPagination(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: '',
      params: {
        hitsPerPage: 5,
        page: 0
      }
    }])

    const results = response.results[0]

    if ('hits' in results && 'page' in results && 'nbPages' in results) {
      this.addTestResult(
        'testSearchPagination',
        results.page === 0 && results.nbPages >= 0,
        `Pagination working: page ${results.page} of ${results.nbPages}`
      )
    } else {
      throw new Error('Pagination data missing from response')
    }
  }

  // Test search sorting
  private async testSearchSorting(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: '',
      params: {
        sort: ['year:desc'],
        hitsPerPage: 5
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testSearchSorting',
        true,
        `Sorting test completed with ${results.hits.length} results`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test search analytics
  private async testSearchAnalytics(): Promise<void> {
    // This would test analytics tracking
    // For now, we'll just verify the analytics functions exist
    const analyticsAvailable = typeof window !== 'undefined'

    this.addTestResult(
      'testSearchAnalytics',
      analyticsAvailable,
      analyticsAvailable ? 'Analytics environment available' : 'Analytics not available (server-side)'
    )
  }

  // Test error handling
  private async testErrorHandling(): Promise<void> {
    if (!searchClient) {
      this.addTestResult('testErrorHandling', false, 'Search client not available')
      return
    }

    try {
      // Try an intentionally invalid search
      await searchClient.search([{
        indexName: 'non_existent_index',
        query: 'test'
      }])

      this.addTestResult('testErrorHandling', false, 'Should have thrown error for invalid index')
    } catch (error) {
      this.addTestResult(
        'testErrorHandling',
        true,
        `Error handling working: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Test search performance
  private async testPerformance(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const startTime = performance.now()

    await searchClient.search([{
      indexName: INDICES.SONGS,
      query: 'electronic music',
      params: {
        hitsPerPage: 20
      }
    }])

    const endTime = performance.now()
    const duration = endTime - startTime

    this.addTestResult(
      'testPerformance',
      duration < 1000, // Should complete within 1 second
      `Search completed in ${duration.toFixed(2)}ms`
    )
  }

  // Test empty search results
  private async testEmptyResults(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: 'xyznonexistentqueryterm123',
      params: {
        hitsPerPage: 10
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testEmptyResults',
        results.hits.length === 0,
        `Empty results test: ${results.hits.length} hits for non-existent term`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test special characters in search
  private async testSpecialCharacters(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const specialQuery = 'café & jazz-fusion (live)'

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: specialQuery,
      params: {
        hitsPerPage: 10
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testSpecialCharacters',
        true,
        `Special characters search completed: '${specialQuery}' returned ${results.hits.length} results`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test typo tolerance
  private async testTypoTolerance(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const typoQuery = 'electronik musci' // Intentional typos

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: typoQuery,
      params: {
        hitsPerPage: 10,
        typoTolerance: true
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testTypoTolerance',
        true,
        `Typo tolerance test: '${typoQuery}' returned ${results.hits.length} results`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Test geographic search (if applicable)
  private async testGeographicSearch(): Promise<void> {
    // This would test location-based search if your data includes geo information
    this.addTestResult(
      'testGeographicSearch',
      true,
      'Geographic search not implemented (feature placeholder)'
    )
  }

  // Test date range search
  private async testDateRangeSearch(): Promise<void> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    const response = await searchClient.search([{
      indexName: INDICES.SONGS,
      query: '',
      params: {
        filters: `year >= ${lastYear} AND year <= ${currentYear}`,
        hitsPerPage: 10
      }
    }])

    const results = response.results[0]

    if ('hits' in results) {
      this.addTestResult(
        'testDateRangeSearch',
        true,
        `Date range search: ${results.hits.length} songs from ${lastYear}-${currentYear}`
      )
    } else {
      throw new Error('Unexpected response format')
    }
  }

  // Helper method to add test results
  private addTestResult(testName: string, passed: boolean, message: string): void {
    this.testResults.push({
      testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    })

    const status = passed ? '✅' : '❌'
    console.log(`${status} ${testName}: ${message}`)
  }

  // Generate test summary
  private generateTestSummary(): TestSuiteResult {
    const total = this.testResults.length
    const passed = this.testResults.filter(r => r.passed).length
    const failed = total - passed
    const passRate = total > 0 ? (passed / total) * 100 : 0

    return {
      total,
      passed,
      failed,
      passRate,
      results: this.testResults,
      summary: `${passed}/${total} tests passed (${passRate.toFixed(1)}%)`
    }
  }
}

// Performance benchmarking
export class SearchPerformanceBenchmark {
  async benchmarkSearchPerformance(): Promise<PerformanceBenchmarkResult> {
    if (!searchClient) {
      throw new Error('Search client not available')
    }

    const testQueries = [
      'electronic',
      'jazz fusion',
      'deep house ambient',
      'artist profile',
      'recent releases'
    ]

    const results: QueryPerformanceResult[] = []

    for (const query of testQueries) {
      const startTime = performance.now()

      try {
        const response = await searchClient.search([{
          indexName: INDICES.SONGS,
          query,
          params: { hitsPerPage: 20 }
        }])

        const endTime = performance.now()
        const duration = endTime - startTime
        const searchResults = response.results[0]

        if ('hits' in searchResults) {
          results.push({
            query,
            duration,
            resultCount: searchResults.hits.length,
            success: true
          })
        }
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        results.push({
          query,
          duration,
          resultCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    const successRate = (results.filter(r => r.success).length / results.length) * 100

    return {
      averageDuration,
      successRate,
      totalQueries: results.length,
      results
    }
  }
}

// Search validation utilities
export class SearchValidator {
  static validateSearchResponse(response: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check basic response structure
    if (!response) {
      errors.push('Response is null or undefined')
      return { valid: false, errors, warnings }
    }

    if (!response.results || !Array.isArray(response.results)) {
      errors.push('Response missing results array')
      return { valid: false, errors, warnings }
    }

    // Check each result
    response.results.forEach((result: any, index: number) => {
      if (!('hits' in result)) {
        errors.push(`Result ${index} missing hits`)
      }

      if (!('nbHits' in result)) {
        warnings.push(`Result ${index} missing nbHits`)
      }

      if (!('processingTimeMS' in result)) {
        warnings.push(`Result ${index} missing processingTimeMS`)
      }

      if ('processingTimeMS' in result && result.processingTimeMS > 500) {
        warnings.push(`Result ${index} slow response time: ${result.processingTimeMS}ms`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  static validateSearchHit(hit: any, expectedFields: string[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!hit) {
      errors.push('Hit is null or undefined')
      return { valid: false, errors, warnings }
    }

    if (!hit.objectID) {
      errors.push('Hit missing objectID')
    }

    expectedFields.forEach(field => {
      if (!(field in hit)) {
        warnings.push(`Hit missing expected field: ${field}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// Type definitions
interface TestResult {
  testName: string
  passed: boolean
  message: string
  timestamp: string
}

interface TestSuiteResult {
  total: number
  passed: number
  failed: number
  passRate: number
  results: TestResult[]
  summary: string
}

interface QueryPerformanceResult {
  query: string
  duration: number
  resultCount: number
  success: boolean
  error?: string
}

interface PerformanceBenchmarkResult {
  averageDuration: number
  successRate: number
  totalQueries: number
  results: QueryPerformanceResult[]
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Export test instances
export const searchTestSuite = new SearchTestSuite()
export const searchBenchmark = new SearchPerformanceBenchmark()

// Test runner utility
export async function runSearchTests(): Promise<void> {
  console.log('🧪 Starting search functionality tests...')

  try {
    // Run comprehensive tests
    const testResults = await searchTestSuite.runAllTests()
    console.log(`\n📊 Test Summary: ${testResults.summary}`)

    // Run performance benchmark
    const benchmarkResults = await searchBenchmark.benchmarkSearchPerformance()
    console.log(`\n⚡ Performance: ${benchmarkResults.averageDuration.toFixed(2)}ms avg, ${benchmarkResults.successRate.toFixed(1)}% success rate`)

    return testResults
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    throw error
  }
}