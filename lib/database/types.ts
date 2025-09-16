// Database type definitions for Supabase tables

export interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  location?: string
  favorite_genres?: string[]
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface Show {
  id: string
  title: string
  description?: string
  show_date: string
  duration_minutes?: number
  artwork_url?: string
  mixcloud_url?: string
  soundcloud_url?: string
  spotify_url?: string
  apple_music_url?: string
  youtube_url?: string
  guest_artist?: string
  guest_bio?: string
  genre_tags?: string[]
  play_count: number
  is_featured: boolean
  is_live: boolean
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  show_id: string
  title: string
  artist: string
  album?: string
  label?: string
  release_year?: number
  genre?: string
  duration_seconds?: number
  play_order?: number
  spotify_track_id?: string
  apple_music_id?: string
  youtube_url?: string
  bandcamp_url?: string
  soundcloud_url?: string
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image_url?: string
  author_id?: string
  category: string
  tags?: string[]
  is_featured: boolean
  is_published: boolean
  published_at?: string
  seo_title?: string
  seo_description?: string
  read_time_minutes?: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface ArtistProfile {
  id: string
  name: string
  slug: string
  bio?: string
  origin_country?: string
  origin_city?: string
  genres?: string[]
  profile_image_url?: string
  banner_image_url?: string
  website_url?: string
  instagram_url?: string
  twitter_url?: string
  facebook_url?: string
  soundcloud_url?: string
  spotify_url?: string
  bandcamp_url?: string
  youtube_url?: string
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface DeepDive {
  id: string
  title: string
  slug: string
  subtitle?: string
  content: string
  featured_image_url?: string
  author_id?: string
  subject_type?: 'artist' | 'genre' | 'album' | 'movement' | 'technique'
  subject_name?: string
  tags?: string[]
  is_featured: boolean
  is_published: boolean
  published_at?: string
  estimated_read_time?: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface UserFavorite {
  id: string
  user_id: string
  item_type: 'show' | 'track' | 'blog_post' | 'artist_profile' | 'deep_dive'
  item_id: string
  created_at: string
}

export interface ListeningHistory {
  id: string
  user_id: string
  show_id: string
  listened_at: string
  duration_listened_seconds?: number
  completed: boolean
}

export interface NewsTicker {
  id: string
  content: string
  is_active: boolean
  priority: number
  start_date: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface LiveStream {
  id: string
  is_live: boolean
  current_track_title?: string
  current_track_artist?: string
  current_show_title?: string
  listeners_count: number
  stream_url?: string
  updated_at: string
}

export interface Station {
  id: string
  name: string
  description?: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface Song {
  id: string
  spinitron_id: number
  song: string
  artist: string
  release?: string
  label?: string
  image?: string
  start_time: string
  duration?: number
  episode_title?: string
  station_id: string
  created_at: string
  updated_at: string
  is_manual: boolean
  added_by_user_id?: string
  manual_added_at?: string
  spotify_track_id?: string
  spotify_artist_id?: string
  spotify_album_id?: string
  enhanced_metadata?: any
}

// Combined types for API responses
export interface ShowWithTracks extends Show {
  tracks: Track[]
}

export interface BlogPostWithAuthor extends BlogPost {
  author: Profile | null
}

export interface DeepDiveWithAuthor extends DeepDive {
  author: Profile | null
}