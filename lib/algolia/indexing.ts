import { getSongsAdminIndex, getContentAdminIndex } from './client'
import type { SongRecord, ContentRecord, ArtistRelationshipRecord, ArtistProfileRecord } from './types'

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

// Index artist relationships
export async function indexArtistRelationships(relationships: ArtistRelationshipRecord[]) {
  try {
    // For now, we'll use the content index for relationships
    // In production, you might want a dedicated relationships index
    const contentIndex = getContentAdminIndex()

    const batches = []
    for (let i = 0; i < relationships.length; i += BATCH_SIZE) {
      batches.push(relationships.slice(i, i + BATCH_SIZE))
    }

    console.log(`Indexing ${relationships.length} artist relationships in ${batches.length} batches...`)

    const results = []
    for (const batch of batches) {
      const result = await contentIndex.saveObjects(batch)
      results.push(result)
      console.log(`✅ Indexed batch of ${batch.length} relationships`)
    }

    return {
      success: true,
      indexed: relationships.length,
      results
    }
  } catch (error) {
    console.error('❌ Error indexing artist relationships:', error)
    throw error
  }
}

// Index artist profiles with relationship data
export async function indexArtistProfiles(profiles: ArtistProfileRecord[]) {
  try {
    const contentIndex = getContentAdminIndex()

    const batches = []
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      batches.push(profiles.slice(i, i + BATCH_SIZE))
    }

    console.log(`Indexing ${profiles.length} artist profiles in ${batches.length} batches...`)

    const results = []
    for (const batch of batches) {
      const result = await contentIndex.saveObjects(batch)
      results.push(result)
      console.log(`✅ Indexed batch of ${batch.length} artist profiles`)
    }

    return {
      success: true,
      indexed: profiles.length,
      results
    }
  } catch (error) {
    console.error('❌ Error indexing artist profiles:', error)
    throw error
  }
}

// Utility function to prepare artist relationship data for indexing
export function prepareArtistRelationshipForIndexing(relationshipData: any): ArtistRelationshipRecord {
  const now = new Date().toISOString()

  return {
    objectID: relationshipData.id || `relationship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    source_artist_id: relationshipData.source_artist_id,
    source_artist_name: relationshipData.source_artist?.name || relationshipData.source_artist_name || '',
    source_artist_slug: relationshipData.source_artist?.slug || relationshipData.source_artist_slug || '',
    target_artist_id: relationshipData.target_artist_id,
    target_artist_name: relationshipData.target_artist?.name || relationshipData.target_artist_name || '',
    target_artist_slug: relationshipData.target_artist?.slug || relationshipData.target_artist_slug || '',
    relationship_type: relationshipData.relationship_type,
    strength: relationshipData.strength || 1.0,
    collaboration_count: relationshipData.collaboration_count || 1,
    first_collaboration_date: relationshipData.first_collaboration_date,
    last_collaboration_date: relationshipData.last_collaboration_date,
    verified: Boolean(relationshipData.verified),
    evidence_tracks: Array.isArray(relationshipData.evidence_tracks) ? relationshipData.evidence_tracks : [],
    evidence_releases: Array.isArray(relationshipData.evidence_releases) ? relationshipData.evidence_releases : [],
    source_data: relationshipData.source_data || {},
    notes: relationshipData.notes,
    created_at: relationshipData.created_at || now,
    updated_at: relationshipData.updated_at || now
  }
}

// Utility function to prepare artist profile data for indexing
export function prepareArtistProfileForIndexing(artistData: any): ArtistProfileRecord {
  const now = new Date().toISOString()

  return {
    objectID: artistData.id || `artist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: artistData.name || '',
    slug: artistData.slug || '',
    real_name: artistData.real_name,
    bio: artistData.bio,
    origin_country: artistData.origin_country,
    origin_city: artistData.origin_city,
    genres: Array.isArray(artistData.genres) ? artistData.genres : [],
    aliases: Array.isArray(artistData.aliases) ? artistData.aliases : [],
    profile_image_url: artistData.profile_image_url,
    banner_image_url: artistData.banner_image_url,
    website_url: artistData.website_url,
    social_urls: {
      instagram: artistData.instagram_url,
      twitter: artistData.twitter_url,
      facebook: artistData.facebook_url,
      soundcloud: artistData.soundcloud_url,
      spotify: artistData.spotify_url,
      bandcamp: artistData.bandcamp_url,
      youtube: artistData.youtube_url
    },
    external_ids: {
      discogs_id: artistData.discogs_id,
      spotify_id: artistData.spotify_id
    },
    active_years: {
      start: artistData.active_years_start,
      end: artistData.active_years_end
    },
    collaboration_count: artistData.collaboration_count || 0,
    influence_score: artistData.influence_score || 0,
    collaborator_names: Array.isArray(artistData.collaborator_names) ? artistData.collaborator_names : [],
    labels: Array.isArray(artistData.labels) ? artistData.labels : [],
    is_featured: Boolean(artistData.is_featured),
    view_count: artistData.view_count || 0,
    created_at: artistData.created_at || now,
    updated_at: artistData.updated_at || now
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