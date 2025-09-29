// Song data structure for Algolia indexing
export interface SongRecord {
  objectID: string
  title: string
  artist: string
  album?: string
  genre?: string[]
  mood?: string[]
  year?: number
  duration?: number
  show_id?: string
  show_title?: string
  show_date?: string
  timeframe?: string // e.g., "morning", "afternoon", "evening", "late_night"
  play_time?: string // ISO timestamp when song was played
  artwork_url?: string
  has_artwork?: boolean
  mixcloud_url?: string
  spotify_url?: string
  youtube_url?: string
  discogs_url?: string
  bpm?: number
  key?: string
  energy_level?: number // 1-10 scale
  danceability?: number // 1-10 scale
  tags?: string[]
  ai_enhanced?: boolean

  // Artist relationship fields (from processing relationships)
  featured_artists?: string[]
  remixers?: string[]
  producers?: string[]
  collaborators?: string[]
  related_artists?: string[]
  has_collaborations?: boolean
  collaboration_count?: number

  created_at: string
  updated_at: string
}

// Artist relationship data structure for Algolia indexing
export interface ArtistRelationshipRecord {
  objectID: string
  source_artist_id: string
  source_artist_name: string
  source_artist_slug: string
  target_artist_id: string
  target_artist_name: string
  target_artist_slug: string
  relationship_type: 'collaboration' | 'remix' | 'featured' | 'producer' | 'label_mate' | 'influence' | 'side_project' | 'group_member'
  strength: number
  collaboration_count: number
  first_collaboration_date?: string
  last_collaboration_date?: string
  verified: boolean
  evidence_tracks?: string[]
  evidence_releases?: string[]
  source_data?: {
    source?: string
    [key: string]: any
  }
  notes?: string
  created_at: string
  updated_at: string
}

// Enhanced artist profile data structure
export interface ArtistProfileRecord {
  objectID: string
  name: string
  slug: string
  real_name?: string
  bio?: string
  origin_country?: string
  origin_city?: string
  genres?: string[]
  aliases?: string[]
  profile_image_url?: string
  banner_image_url?: string
  website_url?: string
  social_urls?: {
    instagram?: string
    twitter?: string
    facebook?: string
    soundcloud?: string
    spotify?: string
    bandcamp?: string
    youtube?: string
  }
  external_ids?: {
    discogs_id?: number
    spotify_id?: string
  }
  active_years?: {
    start?: number
    end?: number
  }
  collaboration_count?: number
  influence_score?: number
  collaborator_names?: string[] // For search
  labels?: string[] // Record labels associated with artist
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

// Content data structure for site content (shows, artists, blog posts, etc.)
export interface ContentRecord {
  objectID: string
  title: string
  content_type: 'show' | 'artist_profile' | 'blog_post' | 'deep_dive' | 'playlist' | 'episode'
  slug: string
  excerpt?: string
  content?: string // Full text content for search
  author?: string
  category?: string
  tags?: string[]
  publish_date?: string
  featured_image?: string
  url: string
  ai_generated?: boolean
  view_count?: number
  duration?: number // For audio/video content
  track_count?: number // For shows/playlists
  genre?: string[]
  mood?: string[]
  metadata?: {
    mixcloud_id?: string
    storyblok_id?: string
    spotify_id?: string
    youtube_id?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

// Search result types with highlighting
export interface SongSearchResult extends SongRecord {
  _highlightResult?: {
    title?: { value: string; matchLevel: string }
    artist?: { value: string; matchLevel: string }
    album?: { value: string; matchLevel: string }
    [key: string]: any
  }
}

export interface ContentSearchResult extends ContentRecord {
  _highlightResult?: {
    title?: { value: string; matchLevel: string }
    content?: { value: string; matchLevel: string }
    excerpt?: { value: string; matchLevel: string }
    [key: string]: any
  }
}

// Search filters
export interface SearchFilters {
  genre?: string[]
  mood?: string[]
  content_type?: string[]
  timeframe?: string[]
  year?: number[]
  date_range?: {
    start: string
    end: string
  }
  has_artwork?: boolean
  ai_generated?: boolean
  author?: string[]
  tags?: string[]
}

// Search configuration
export interface SearchOptions {
  query: string
  filters?: SearchFilters
  page?: number
  hitsPerPage?: number
  sortBy?: string
  facets?: string[]
  typoTolerance?: boolean
  attributesToRetrieve?: string[]
}

// Facet counts
export interface FacetCounts {
  [facetName: string]: {
    [facetValue: string]: number
  }
}

// Search response
export interface SearchResponse<T> {
  hits: T[]
  nbHits: number
  page: number
  nbPages: number
  hitsPerPage: number
  processingTimeMS: number
  facets?: FacetCounts
  query: string
}

// Analytics event types
export type SearchAnalyticsEvent =
  | 'search'
  | 'click'
  | 'filter'
  | 'view_more'
  | 'clear_filters'
  | 'suggestion_click'

export interface SearchAnalytics {
  event: SearchAnalyticsEvent
  query?: string
  filters?: SearchFilters
  result_count?: number
  clicked_position?: number
  clicked_object_id?: string
  timestamp: string
  user_id?: string
  session_id: string
}