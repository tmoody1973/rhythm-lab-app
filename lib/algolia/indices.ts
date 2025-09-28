import { getSongsAdminIndex, getContentAdminIndex, SONGS_FACETS, CONTENT_FACETS } from './client'

// Songs index settings
export const SONGS_INDEX_SETTINGS = {
  attributesForFaceting: [
    'filterOnly(genre)',
    'filterOnly(mood)',
    'filterOnly(year)',
    'filterOnly(album)',
    'filterOnly(show_date)',
    'filterOnly(timeframe)',
    'filterOnly(has_artwork)',
    'filterOnly(ai_enhanced)'
  ],
  searchableAttributes: [
    'title,artist', // Primary searchable fields with equal importance
    'album',
    'show_title',
    'tags',
    'genre',
    'mood'
  ],
  attributesToRetrieve: [
    'objectID',
    'title',
    'artist',
    'album',
    'genre',
    'mood',
    'year',
    'duration',
    'show_title',
    'show_date',
    'timeframe',
    'play_time',
    'artwork_url',
    'has_artwork',
    'mixcloud_url',
    'spotify_url',
    'youtube_url',
    'bpm',
    'energy_level',
    'danceability',
    'tags',
    'ai_enhanced'
  ],
  customRanking: [
    'desc(energy_level)',
    'desc(play_time)', // More recent plays ranked higher
    'asc(title)' // Alphabetical as tiebreaker
  ],
  ranking: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ],
  typoTolerance: {
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8
  },
  separatorsToIndex: '-_',
  removeWordsIfNoResults: 'lastWords',
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,
  advancedSyntax: true,
  allowTyposOnNumericTokens: false,
  ignorePlurals: true,
  removeStopWords: true,
  queryLanguages: ['en'],
  indexLanguages: ['en'],
  highlightPreTag: '<mark class="bg-red-500/20 text-red-200">',
  highlightPostTag: '</mark>',
  snippetEllipsisText: '...',
  hitsPerPage: 20,
  maxValuesPerFacet: 100,
  distinct: true,
  attributeForDistinct: 'title'
}

// Content index settings
export const CONTENT_INDEX_SETTINGS = {
  attributesForFaceting: [
    'filterOnly(content_type)',
    'filterOnly(category)',
    'filterOnly(tags)',
    'filterOnly(publish_date)',
    'filterOnly(author)',
    'filterOnly(ai_generated)',
    'filterOnly(genre)',
    'filterOnly(mood)'
  ],
  searchableAttributes: [
    'title',
    'excerpt',
    'content',
    'author',
    'tags',
    'category',
    'genre',
    'mood'
  ],
  attributesToRetrieve: [
    'objectID',
    'title',
    'content_type',
    'slug',
    'excerpt',
    'author',
    'category',
    'tags',
    'publish_date',
    'featured_image',
    'url',
    'ai_generated',
    'view_count',
    'duration',
    'track_count',
    'genre',
    'mood',
    'metadata'
  ],
  customRanking: [
    'desc(view_count)',
    'desc(publish_date)', // More recent content ranked higher
    'asc(title)' // Alphabetical as tiebreaker
  ],
  ranking: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ],
  typoTolerance: {
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8
  },
  separatorsToIndex: '-_',
  removeWordsIfNoResults: 'lastWords',
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,
  advancedSyntax: true,
  allowTyposOnNumericTokens: false,
  ignorePlurals: true,
  removeStopWords: true,
  queryLanguages: ['en'],
  indexLanguages: ['en'],
  highlightPreTag: '<mark class="bg-purple-500/20 text-purple-200">',
  highlightPostTag: '</mark>',
  snippetEllipsisText: '...',
  hitsPerPage: 20,
  maxValuesPerFacet: 100,
  distinct: true,
  attributeForDistinct: 'slug'
}

// Configure indices with settings
export async function configureSearchIndices() {
  try {
    console.log('Configuring Algolia search indices...')

    // Configure songs index
    const songsIndex = getSongsAdminIndex()
    await songsIndex.setSettings(SONGS_INDEX_SETTINGS)
    console.log('✅ Songs index configured successfully')

    // Configure content index
    const contentIndex = getContentAdminIndex()
    await contentIndex.setSettings(CONTENT_INDEX_SETTINGS)
    console.log('✅ Content index configured successfully')

    return {
      success: true,
      message: 'All search indices configured successfully'
    }
  } catch (error) {
    console.error('❌ Error configuring search indices:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get index statistics
export async function getIndexStats() {
  try {
    const songsIndex = getSongsAdminIndex()
    const contentIndex = getContentAdminIndex()

    const [songsStats, contentStats] = await Promise.all([
      songsIndex.getStats(),
      contentIndex.getStats()
    ])

    return {
      songs: {
        records: songsStats.numberOfRecords,
        size: songsStats.dataSize,
        fileSize: songsStats.fileSize
      },
      content: {
        records: contentStats.numberOfRecords,
        size: contentStats.dataSize,
        fileSize: contentStats.fileSize
      }
    }
  } catch (error) {
    console.error('Error getting index stats:', error)
    throw error
  }
}

// Clear all indices (use with caution)
export async function clearAllIndices() {
  try {
    const songsIndex = getSongsAdminIndex()
    const contentIndex = getContentAdminIndex()

    await Promise.all([
      songsIndex.clearObjects(),
      contentIndex.clearObjects()
    ])

    console.log('✅ All indices cleared successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error clearing indices:', error)
    throw error
  }
}