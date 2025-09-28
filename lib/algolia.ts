import { algoliasearch } from 'algoliasearch'

// Algolia client configuration
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!
const searchApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!

export const searchClient = algoliasearch(appId, searchApiKey)

// Index names - you'll need to set these up in your Algolia dashboard
export const INDICES = {
  SONGS: 'rhythm_lab_songs',
  CONTENT: 'rhythm_lab_content',
  SHOWS: 'rhythm_lab_shows',
  ARTISTS: 'rhythm_lab_artists'
} as const

// TypeScript interfaces for search results
export interface SongHit {
  objectID: string
  title: string
  artist: string
  album?: string
  artwork?: string
  date: string
  timeframe: string // 'morning', 'afternoon', 'evening', 'late_night'
  genre?: string
  bpm?: number
  duration?: number
  show_id?: string
  show_title?: string
  stream_timestamp?: string
  _highlightResult?: any
}

export interface ContentHit {
  objectID: string
  title: string
  type: 'show' | 'artist' | 'blog' | 'deep_dive' | 'episode'
  description?: string
  author?: string
  published_date: string
  tags?: string[]
  image?: string
  url: string
  _highlightResult?: any
}

export interface ShowHit {
  objectID: string
  title: string
  description?: string
  date: string
  mixcloud_url?: string
  artwork?: string
  track_count?: number
  duration?: string
  tags?: string[]
  _highlightResult?: any
}

export interface ArtistHit {
  objectID: string
  name: string
  bio?: string
  genre?: string[]
  image?: string
  social_links?: Record<string, string>
  featured_tracks?: string[]
  _highlightResult?: any
}

// Helper function to get timeframe from date
export function getTimeframe(date: Date): string {
  const hour = date.getHours()

  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'late_night'
}

// Helper function to format search results
export function formatSongResult(hit: SongHit) {
  return {
    id: hit.objectID,
    title: hit.title,
    artist: hit.artist,
    album: hit.album,
    artwork: hit.artwork,
    date: hit.date,
    timeframe: hit.timeframe,
    genre: hit.genre,
    show: hit.show_title,
    highlights: hit._highlightResult
  }
}

export function formatContentResult(hit: ContentHit) {
  return {
    id: hit.objectID,
    title: hit.title,
    type: hit.type,
    description: hit.description,
    author: hit.author,
    publishedDate: hit.published_date,
    tags: hit.tags || [],
    image: hit.image,
    url: hit.url,
    highlights: hit._highlightResult
  }
}