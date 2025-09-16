// Spinitron API response types

export interface SpinitrondSpin {
  id: number
  start: string // ISO 8601 datetime
  duration: number // seconds
  song: string
  artist: string
  composer?: string
  release?: string
  label?: string
  year?: number
  genre?: string
  image?: string
  episode_id?: number
  episode_title?: string
  disk_number?: number
  track_number?: number
  note?: string
  request?: boolean
  new?: boolean
  local?: boolean
  playlist_id?: number
}

export interface SpinitrondPlaylist {
  id: number
  episode_name: string
  episode_description?: string
  start: string
  end?: string
  category?: string
  url?: string
  image?: string
  since?: string
  until?: string
  automation?: boolean
  hide_dj?: boolean
  timezone?: string
}

export interface SpinitrondShow {
  id: number
  title: string
  description?: string
  since?: string
  until?: string
  category?: string
  url?: string
  image?: string
  timezone?: string
}

export interface SpinitrondDJ {
  id: number
  name: string
  bio?: string
  image?: string
  website?: string
}

export interface SpinitrondPersona {
  id: number
  name: string
  bio?: string
  image?: string
  since?: string
  until?: string
}

// API Response wrappers
export interface SpinitrondApiResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

// Configuration types
export interface SpinitrondConfig {
  apiKey: string
  baseUrl: string
  stationId: string
  timezone?: string
}

// Internal transformed types for our database
export interface TransformedSong {
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
  enhanced_metadata?: any
}