/**
 * TypeScript types for Mixcloud-specific database tables
 * These match the schema defined in supabase/migrations/create_mixcloud_schema.sql
 */

export interface MixcloudShow {
  id: string
  title: string
  slug: string
  description?: string
  mixcloud_url: string
  mixcloud_embed?: string
  mixcloud_picture?: string
  publish_date: string // ISO timestamp
  storyblok_id?: string
  created_at: string
  updated_at: string
}

export interface MixcloudTrack {
  id: string
  show_id: string
  position: number // Global position in show (1, 2, 3...)
  hour?: number // Which hour of the show (1, 2, 3... or NULL)
  artist: string
  track: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
  created_at: string
  updated_at: string
}

// Enhanced types for working with external API data
export interface EnhancedMixcloudTrack extends MixcloudTrack {
  // YouTube enhancement data
  youtube_video_id?: string
  youtube_title?: string
  youtube_channel?: string
  youtube_thumbnail?: string

  // Discogs enhancement data
  discogs_artist_id?: number
  discogs_artist_name?: string
  discogs_artist_image?: string
  discogs_genres?: string[]
  discogs_profile?: string
}

// For API responses
export interface MixcloudShowWithTracks extends MixcloudShow {
  tracks: MixcloudTrack[]
}

export interface EnhancedMixcloudShowWithTracks extends MixcloudShow {
  tracks: EnhancedMixcloudTrack[]
}

// For database operations
export interface CreateMixcloudShow {
  title: string
  slug: string
  description?: string
  mixcloud_url: string
  mixcloud_embed?: string
  mixcloud_picture?: string
  publish_date: string
  storyblok_id?: string
}

export interface UpdateMixcloudShow {
  title?: string
  slug?: string
  description?: string
  mixcloud_embed?: string
  mixcloud_picture?: string
  publish_date?: string
  storyblok_id?: string
}

export interface CreateMixcloudTrack {
  show_id: string
  position: number
  hour?: number
  artist: string
  track: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
}

export interface UpdateMixcloudTrack {
  position?: number
  hour?: number
  artist?: string
  track?: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
}

// For track enhancement operations
export interface TrackEnhancementData {
  id: string
  artist: string
  track: string
  current_youtube_url?: string
  current_discogs_url?: string
  current_spotify_url?: string
}

export interface EnhancementResult {
  track_id: string
  youtube_url?: string
  discogs_url?: string
  youtube_success: boolean
  discogs_success: boolean
  error_message?: string
}

// For Storyblok integration
export interface StoryblokTrackData {
  component: 'track'
  artist: string
  track: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
  position?: number
  hour?: number
}

export interface StoryblokShowData {
  component: 'mixcloud_show'
  title: string
  description?: string
  mixcloud_url: string
  mixcloud_embed?: string
  mixcloud_picture?: any // Storyblok asset object
  published_date: string
  tracklist: StoryblokTrackData[]
  show_id: string
}

// Utility types for validation
export interface TrackValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ShowValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  trackValidation: TrackValidationResult[]
}

// For admin interface
export interface ShowEnhancementStatus {
  show_id: string
  title: string
  total_tracks: number
  tracks_with_youtube: number
  tracks_with_discogs: number
  tracks_with_spotify: number
  enhancement_percentage: number
  last_enhanced?: string
  needs_enhancement: boolean
}

export interface BatchEnhancementRequest {
  show_ids: string[]
  options: {
    enable_youtube: boolean
    enable_discogs: boolean
    enable_spotify: boolean
    skip_existing: boolean
    force_refresh: boolean
  }
}

export interface BatchEnhancementProgress {
  total_shows: number
  completed_shows: number
  current_show: string
  current_track: string
  total_tracks_processed: number
  successful_enhancements: number
  failed_enhancements: number
  quota_warnings: string[]
}

// Database query helpers
export type MixcloudShowOrderBy = 'publish_date' | 'title' | 'created_at' | 'updated_at'
export type MixcloudTrackOrderBy = 'position' | 'artist' | 'track' | 'created_at'
export type SortOrder = 'asc' | 'desc'

export interface MixcloudShowQuery {
  limit?: number
  offset?: number
  search?: string
  storyblok_id?: string
  has_storyblok_id?: boolean
  order_by?: MixcloudShowOrderBy
  sort_order?: SortOrder
  date_from?: string
  date_to?: string
}

export interface MixcloudTrackQuery {
  show_id?: string
  limit?: number
  offset?: number
  search?: string
  has_youtube?: boolean
  has_discogs?: boolean
  has_spotify?: boolean
  order_by?: MixcloudTrackOrderBy
  sort_order?: SortOrder
}