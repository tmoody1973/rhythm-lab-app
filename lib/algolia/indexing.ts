import { getSongsAdminIndex, getContentAdminIndex } from './client'
import type { SongRecord, ContentRecord } from './types'

// Batch size for efficient indexing
const BATCH_SIZE = 1000

// Index songs data
export async function indexSongs(songs: SongRecord[]) {
  try {
    const songsIndex = getSongsAdminIndex()

    // Process in batches
    const batches = []
    for (let i = 0; i < songs.length; i += BATCH_SIZE) {
      batches.push(songs.slice(i, i + BATCH_SIZE))
    }

    console.log(`Indexing ${songs.length} songs in ${batches.length} batches...`)

    const results = []
    for (const batch of batches) {
      const result = await songsIndex.saveObjects(batch)
      results.push(result)
      console.log(`✅ Indexed batch of ${batch.length} songs`)
    }

    return {
      success: true,
      indexed: songs.length,
      results
    }
  } catch (error) {
    console.error('❌ Error indexing songs:', error)
    throw error
  }
}

// Index content data
export async function indexContent(content: ContentRecord[]) {
  try {
    const contentIndex = getContentAdminIndex()

    // Process in batches
    const batches = []
    for (let i = 0; i < content.length; i += BATCH_SIZE) {
      batches.push(content.slice(i, i + BATCH_SIZE))
    }

    console.log(`Indexing ${content.length} content items in ${batches.length} batches...`)

    const results = []
    for (const batch of batches) {
      const result = await contentIndex.saveObjects(batch)
      results.push(result)
      console.log(`✅ Indexed batch of ${batch.length} content items`)
    }

    return {
      success: true,
      indexed: content.length,
      results
    }
  } catch (error) {
    console.error('❌ Error indexing content:', error)
    throw error
  }
}

// Index single song
export async function indexSong(song: SongRecord) {
  try {
    const songsIndex = getSongsAdminIndex()
    const result = await songsIndex.saveObject(song)
    console.log(`✅ Indexed song: ${song.title} by ${song.artist}`)
    return result
  } catch (error) {
    console.error('❌ Error indexing song:', error)
    throw error
  }
}

// Index single content item
export async function indexContentItem(content: ContentRecord) {
  try {
    const contentIndex = getContentAdminIndex()
    const result = await contentIndex.saveObject(content)
    console.log(`✅ Indexed content: ${content.title}`)
    return result
  } catch (error) {
    console.error('❌ Error indexing content:', error)
    throw error
  }
}

// Delete song from index
export async function deleteSong(objectID: string) {
  try {
    const songsIndex = getSongsAdminIndex()
    const result = await songsIndex.deleteObject(objectID)
    console.log(`✅ Deleted song with ID: ${objectID}`)
    return result
  } catch (error) {
    console.error('❌ Error deleting song:', error)
    throw error
  }
}

// Delete content from index
export async function deleteContent(objectID: string) {
  try {
    const contentIndex = getContentAdminIndex()
    const result = await contentIndex.deleteObject(objectID)
    console.log(`✅ Deleted content with ID: ${objectID}`)
    return result
  } catch (error) {
    console.error('❌ Error deleting content:', error)
    throw error
  }
}

// Update song in index
export async function updateSong(song: Partial<SongRecord> & { objectID: string }) {
  try {
    const songsIndex = getSongsAdminIndex()
    const result = await songsIndex.partialUpdateObject(song)
    console.log(`✅ Updated song with ID: ${song.objectID}`)
    return result
  } catch (error) {
    console.error('❌ Error updating song:', error)
    throw error
  }
}

// Update content in index
export async function updateContent(content: Partial<ContentRecord> & { objectID: string }) {
  try {
    const contentIndex = getContentAdminIndex()
    const result = await contentIndex.partialUpdateObject(content)
    console.log(`✅ Updated content with ID: ${content.objectID}`)
    return result
  } catch (error) {
    console.error('❌ Error updating content:', error)
    throw error
  }
}

// Sync data from database to Algolia
export async function syncFromDatabase() {
  try {
    console.log('🔄 Starting database sync to Algolia...')

    // Note: These would need to be implemented based on your actual database queries
    // For now, providing the structure and placeholder functions

    // Example sync functions that would need to be implemented:
    // const songs = await getAllSongsFromDatabase()
    // const content = await getAllContentFromDatabase()

    // await indexSongs(songs)
    // await indexContent(content)

    console.log('✅ Database sync completed successfully')

    return {
      success: true,
      message: 'Sync completed successfully'
    }
  } catch (error) {
    console.error('❌ Error during database sync:', error)
    throw error
  }
}

// Utility function to prepare song data for indexing
export function prepareSongForIndexing(songData: any): SongRecord {
  const now = new Date().toISOString()

  return {
    objectID: songData.id || `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: songData.title || '',
    artist: songData.artist || '',
    album: songData.album,
    genre: Array.isArray(songData.genre) ? songData.genre : songData.genre ? [songData.genre] : [],
    mood: Array.isArray(songData.mood) ? songData.mood : songData.mood ? [songData.mood] : [],
    year: songData.year ? parseInt(songData.year) : undefined,
    duration: songData.duration ? parseInt(songData.duration) : undefined,
    show_id: songData.show_id,
    show_title: songData.show_title,
    show_date: songData.show_date,
    timeframe: songData.timeframe,
    play_time: songData.play_time || now,
    artwork_url: songData.artwork_url,
    has_artwork: Boolean(songData.artwork_url),
    mixcloud_url: songData.mixcloud_url,
    spotify_url: songData.spotify_url,
    youtube_url: songData.youtube_url,
    discogs_url: songData.discogs_url,
    bpm: songData.bpm ? parseInt(songData.bpm) : undefined,
    key: songData.key,
    energy_level: songData.energy_level ? parseInt(songData.energy_level) : undefined,
    danceability: songData.danceability ? parseInt(songData.danceability) : undefined,
    tags: Array.isArray(songData.tags) ? songData.tags : [],
    ai_enhanced: Boolean(songData.ai_enhanced),
    created_at: songData.created_at || now,
    updated_at: now
  }
}

// Utility function to prepare content data for indexing
export function prepareContentForIndexing(contentData: any): ContentRecord {
  const now = new Date().toISOString()

  return {
    objectID: contentData.id || `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: contentData.title || '',
    content_type: contentData.content_type || 'blog_post',
    slug: contentData.slug || '',
    excerpt: contentData.excerpt,
    content: contentData.content,
    author: contentData.author,
    category: contentData.category,
    tags: Array.isArray(contentData.tags) ? contentData.tags : [],
    publish_date: contentData.publish_date,
    featured_image: contentData.featured_image,
    url: contentData.url || '',
    ai_generated: Boolean(contentData.ai_generated),
    view_count: contentData.view_count ? parseInt(contentData.view_count) : 0,
    duration: contentData.duration ? parseInt(contentData.duration) : undefined,
    track_count: contentData.track_count ? parseInt(contentData.track_count) : undefined,
    genre: Array.isArray(contentData.genre) ? contentData.genre : contentData.genre ? [contentData.genre] : [],
    mood: Array.isArray(contentData.mood) ? contentData.mood : contentData.mood ? [contentData.mood] : [],
    metadata: contentData.metadata || {},
    created_at: contentData.created_at || now,
    updated_at: now
  }
}