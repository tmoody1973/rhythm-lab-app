// Database query functions for Supabase

import { createClient } from '@/lib/supabase/client'
import type {
  Show,
  Track,
  BlogPost,
  ArtistProfile,
  DeepDive,
  ShowWithTracks,
  BlogPostWithAuthor,
  DeepDiveWithAuthor,
  NewsTicker,
  LiveStream,
  Station,
  Song
} from './types'

export const supabase = createClient()

// Shows queries
export async function getFeaturedShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'published')
    .order('show_date', { ascending: false })
    .limit(2)

  if (error) throw error
  return data || []
}

export async function getAllShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('status', 'published')
    .order('show_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getShowWithTracks(showId: string): Promise<ShowWithTracks | null> {
  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .eq('status', 'published')
    .single()

  if (showError) throw showError
  if (!show) return null

  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('show_id', showId)
    .order('play_order', { ascending: true })

  if (tracksError) throw tracksError

  return {
    ...show,
    tracks: tracks || []
  }
}

// Blog posts queries
export async function getFeaturedBlogPosts(): Promise<BlogPostWithAuthor[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('is_featured', true)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(2)

  if (error) throw error
  return data || []
}

export async function getAllBlogPosts(): Promise<BlogPostWithAuthor[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostWithAuthor | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) throw error
  return data
}

// Artist profiles queries
export async function getFeaturedArtists(): Promise<ArtistProfile[]> {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(2)

  if (error) throw error
  return data || []
}

export async function getAllArtists(): Promise<ArtistProfile[]> {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getArtistBySlug(slug: string): Promise<ArtistProfile | null> {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

// Deep dives queries
export async function getFeaturedDeepDives(): Promise<DeepDiveWithAuthor[]> {
  const { data, error } = await supabase
    .from('deep_dives')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('is_featured', true)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(2)

  if (error) throw error
  return data || []
}

export async function getAllDeepDives(): Promise<DeepDiveWithAuthor[]> {
  const { data, error } = await supabase
    .from('deep_dives')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDeepDiveBySlug(slug: string): Promise<DeepDiveWithAuthor | null> {
  const { data, error } = await supabase
    .from('deep_dives')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) throw error
  return data
}

// News ticker queries
export async function getActiveNewsTicker(): Promise<NewsTicker[]> {
  const { data, error } = await supabase
    .from('news_ticker')
    .select('*')
    .eq('is_active', true)
    .or('end_date.is.null,end_date.gt.now()')
    .order('priority', { ascending: false })

  if (error) throw error
  return data || []
}

// Live stream queries
export async function getLiveStreamStatus(): Promise<LiveStream | null> {
  const { data, error } = await supabase
    .from('live_stream')
    .select('*')
    .limit(1)
    .single()

  if (error) throw error
  return data
}

// User favorites queries (requires authentication)
export async function addToFavorites(itemType: string, itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: user.id,
      item_type: itemType,
      item_id: itemId
    })

  if (error) throw error
}

export async function removeFromFavorites(itemType: string, itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)

  if (error) throw error
}

export async function getUserFavorites(itemType?: string): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  let query = supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', user.id)

  if (itemType) {
    query = query.eq('item_type', itemType)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Listening history queries (requires authentication)
export async function addListeningHistory(showId: string, durationListened?: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('listening_history')
    .insert({
      user_id: user.id,
      show_id: showId,
      duration_listened_seconds: durationListened,
      completed: false
    })

  if (error) throw error
}

// Spinitron songs queries
export async function getCurrentlyPlaying(stationId: string = 'rlr-main'): Promise<Song | null> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('station_id', stationId)
    .lte('start_time', new Date().toISOString())
    .order('start_time', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // No currently playing song found is not an error
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getRecentSongs(stationId: string = 'rlr-main', limit: number = 10): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('station_id', stationId)
    .order('start_time', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getSongsByArtist(artist: string, limit: number = 20): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .ilike('artist', `%${artist}%`)
    .order('start_time', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function addManualSong(songData: Partial<Song>): Promise<Song> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('songs')
    .insert({
      ...songData,
      is_manual: true,
      added_by_user_id: user.id,
      manual_added_at: new Date().toISOString(),
      station_id: songData.station_id || 'rlr-main'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Station queries
export async function getAllStations(): Promise<Station[]> {
  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

// Search function (updated to include songs)
export async function searchContent(query: string): Promise<any> {
  const [shows, blogPosts, artists, deepDives, songs] = await Promise.all([
    supabase
      .from('shows')
      .select('*')
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .limit(5),

    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5),

    supabase
      .from('artist_profiles')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(5),

    supabase
      .from('deep_dives')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5),

    supabase
      .from('songs')
      .select('*')
      .or(`song.ilike.%${query}%,artist.ilike.%${query}%,release.ilike.%${query}%`)
      .order('start_time', { ascending: false })
      .limit(5)
  ])

  return {
    shows: shows.data || [],
    blogPosts: blogPosts.data || [],
    artists: artists.data || [],
    deepDives: deepDives.data || [],
    songs: songs.data || []
  }
}