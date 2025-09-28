import { algoliasearch } from 'algoliasearch'

// Ensure environment variables are available
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
const searchApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY

// Graceful fallback for missing environment variables during build
const hasValidConfig = appId && searchApiKey

if (!hasValidConfig && typeof window !== 'undefined') {
  console.warn('Missing Algolia environment variables. Search functionality will be disabled.')
}

// Search client for public use (frontend) - with fallback
export const searchClient = hasValidConfig
  ? algoliasearch(appId!, searchApiKey!)
  : null

// Admin client for indexing operations (backend only)
export const adminClient = adminApiKey && hasValidConfig ? algoliasearch(appId!, adminApiKey) : null

// Index names - Updated with new structure for better organization
export const INDICES = {
  ARCHIVE_TRACKS: process.env.ALGOLIA_ARCHIVE_TRACKS_INDEX || 'rhythm_lab_archive_tracks', // Mixcloud tracks with show context
  LIVE_SONGS: process.env.ALGOLIA_LIVE_SONGS_INDEX || 'rhythm_lab_live_songs', // Spinitron live stream songs
  CONTENT: process.env.ALGOLIA_CONTENT_INDEX || 'rhythm_lab_content', // Storyblok content (blogs, deep dives, etc)

  // Legacy indices (keep for backward compatibility)
  SONGS: process.env.ALGOLIA_SONGS_INDEX || 'rhythm_lab_songs',
  PAGES: process.env.ALGOLIA_PAGES_INDEX || 'rhythm_lab_app_pages',
  ARTICLES: process.env.ALGOLIA_ARTICLES_INDEX || 'rhythm_lab_app_articles'
} as const

// Get search indices - with null checks
// Note: In Algolia v5, we use searchClient directly with search() method instead of initIndex()
export const songsIndex = searchClient ? {
  search: (params: any) => searchClient.search([{ indexName: INDICES.SONGS, ...params }]),
  searchForFacetValues: (params: any) => searchClient.searchForFacetValues([{ indexName: INDICES.SONGS, ...params }])
} : null

export const contentIndex = searchClient ? {
  search: (params: any) => searchClient.search([{ indexName: INDICES.CONTENT, ...params }]),
  searchForFacetValues: (params: any) => searchClient.searchForFacetValues([{ indexName: INDICES.CONTENT, ...params }])
} : null

export const pagesIndex = searchClient ? {
  search: (params: any) => searchClient.search([{ indexName: INDICES.PAGES, ...params }]),
  searchForFacetValues: (params: any) => searchClient.searchForFacetValues([{ indexName: INDICES.PAGES, ...params }])
} : null

// Get admin indices (for backend operations)
export const getSongsAdminIndex = () => {
  if (!adminClient) throw new Error('Admin client not available')
  return {
    search: (params: any) => adminClient.search([{ indexName: INDICES.SONGS, ...params }]),
    searchForFacetValues: (params: any) => adminClient.searchForFacetValues([{ indexName: INDICES.SONGS, ...params }])
  }
}

export const getContentAdminIndex = () => {
  if (!adminClient) throw new Error('Admin client not available')
  return {
    search: (params: any) => adminClient.search([{ indexName: INDICES.CONTENT, ...params }]),
    searchForFacetValues: (params: any) => adminClient.searchForFacetValues([{ indexName: INDICES.CONTENT, ...params }])
  }
}

export const getPagesAdminIndex = () => {
  if (!adminClient) throw new Error('Admin client not available')
  return {
    search: (params: any) => adminClient.search([{ indexName: INDICES.PAGES, ...params }]),
    searchForFacetValues: (params: any) => adminClient.searchForFacetValues([{ indexName: INDICES.PAGES, ...params }])
  }
}

// Search configuration
export const SEARCH_CONFIG = {
  hitsPerPage: 20,
  attributesToRetrieve: ['*'],
  attributesToHighlight: ['title', 'artist', 'content'],
  highlightPreTag: '<mark>',
  highlightPostTag: '</mark>',
  maxValuesPerFacet: 20,
  typoTolerance: true
} as const

// Facet configuration for songs
export const SONGS_FACETS = [
  'genre',
  'mood',
  'year',
  'album',
  'show_date',
  'timeframe',
  'has_artwork'
] as const

// Facet configuration for content
export const CONTENT_FACETS = [
  'content_type',
  'category',
  'tags',
  'publish_date',
  'author',
  'ai_generated'
] as const