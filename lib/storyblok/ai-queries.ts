/**
 * Storyblok AI Query Functions
 *
 * These functions query Storyblok for artist data and format it
 * in a way that's optimized for AI consumption and UI generation.
 */

import { sb } from '@/src/lib/storyblok'
import { safeRenderText } from '@/lib/utils/rich-text'

export interface AIArtistProfile {
  id: string | number
  slug: string
  name: string
  artist_name: string
  photo?: string
  short_bio?: string
  full_bio?: string
  genres: string[]
  tags: string[]
  spotify_url?: string
  youtube_url?: string
  bandcamp_url?: string
  soundcloud_url?: string
  website_url?: string
  profile_url: string
  discography?: any[]
  origin_city?: string
  origin_country?: string
  published_at?: string
}

/**
 * Search for artists by genre and optional mood
 */
export async function searchArtistsByGenre(
  genres: string[],
  mood?: string,
  limit: number = 6
): Promise<AIArtistProfile[]> {
  try {
    const storyblokApi = sb()

    // Build the query
    const query: any = {
      version: 'published',
      starts_with: 'profiles/',
      per_page: limit,
      sort_by: 'first_published_at:desc',
    }

    // If genres provided, filter by tags
    if (genres.length > 0) {
      // Storyblok filter_query for tags
      query.filter_query = {
        tags: {
          in_array: genres.map(g => g.toLowerCase()).join(',')
        }
      }
    }

    const response = await storyblokApi.get('cdn/stories', query)
    const stories = response.data.stories || []

    // Transform and filter by mood if provided
    let artists = stories.map((story: any) => transformStoryToArtist(story))

    // If mood is specified, try to filter by mood in bio/description
    if (mood && artists.length > 0) {
      const moodKeywords = getMoodKeywords(mood)
      const moodFiltered = artists.filter((artist: AIArtistProfile) => {
        const searchText = `${artist.short_bio} ${artist.full_bio} ${artist.tags.join(' ')}`.toLowerCase()
        return moodKeywords.some(keyword => searchText.includes(keyword))
      })

      // If mood filter found matches, use those, otherwise return all
      if (moodFiltered.length > 0) {
        artists = moodFiltered
      }
    }

    return artists.slice(0, limit)
  } catch (error) {
    console.error('Error searching artists by genre:', error)
    return []
  }
}

/**
 * Get a specific artist profile by slug
 */
export async function getArtistProfile(
  artistSlug: string
): Promise<AIArtistProfile | null> {
  try {
    const storyblokApi = sb()

    const response = await storyblokApi.get(`cdn/stories/profiles/${artistSlug}`, {
      version: 'published'
    })

    if (!response.data.story) {
      return null
    }

    return transformStoryToArtist(response.data.story)
  } catch (error) {
    console.error('Error getting artist profile:', error)
    return null
  }
}

/**
 * Find similar artists based on shared genres/tags
 */
export async function getSimilarArtists(
  artistSlug: string,
  limit: number = 5
): Promise<AIArtistProfile[]> {
  try {
    // First get the artist to find their genres
    const artist = await getArtistProfile(artistSlug)
    if (!artist || artist.genres.length === 0) {
      return []
    }

    // Search for artists with similar genres
    const similar = await searchArtistsByGenre(artist.genres, undefined, limit + 1)

    // Filter out the original artist
    return similar
      .filter(a => a.slug !== artistSlug)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting similar artists:', error)
    return []
  }
}

/**
 * Search artists by name
 */
export async function searchArtistsByName(
  query: string,
  limit: number = 10
): Promise<AIArtistProfile[]> {
  try {
    const storyblokApi = sb()

    const response = await storyblokApi.get('cdn/stories', {
      version: 'published',
      starts_with: 'profiles/',
      per_page: limit,
      search_term: query,
    })

    const stories = response.data.stories || []
    return stories.map((story: any) => transformStoryToArtist(story))
  } catch (error) {
    console.error('Error searching artists by name:', error)
    return []
  }
}

/**
 * Transform a Storyblok story into an AI-friendly artist profile
 */
function transformStoryToArtist(story: any): AIArtistProfile {
  const content = story.content || {}

  return {
    id: story.id,
    slug: story.slug,
    name: story.name,
    artist_name: content.artist_name || story.name,
    photo: content.artist_photo?.filename || content.seo?.[0]?.og_image?.filename,
    short_bio: safeRenderText(content.short_bio) || safeRenderText(content.intro) || safeRenderText(content.subtitle),
    full_bio: safeRenderText(content.full_biography) || safeRenderText(content.bio) || safeRenderText(content.description),
    genres: content.tags || content.genre || content.genres || [],
    tags: content.tags || [],
    spotify_url: content.spotify_url,
    youtube_url: content.youtube_url,
    bandcamp_url: content.bandcamp_url,
    soundcloud_url: content.soundcloud_url,
    website_url: content.website_url,
    profile_url: `/profiles/${story.slug}`,
    discography: content.discography || content.releases || [],
    origin_city: content.origin_city,
    origin_country: content.origin_country,
    published_at: story.published_at || story.created_at,
  }
}

/**
 * Get mood keywords for filtering
 */
function getMoodKeywords(mood: string): string[] {
  const moodMap: Record<string, string[]> = {
    chill: ['chill', 'relaxed', 'calm', 'mellow', 'ambient', 'downtempo', 'lo-fi', 'lofi'],
    energetic: ['energetic', 'upbeat', 'high-energy', 'fast', 'danceable', 'party', 'club'],
    dark: ['dark', 'moody', 'atmospheric', 'haunting', 'noir', 'shadow'],
    uplifting: ['uplifting', 'positive', 'happy', 'joyful', 'bright', 'cheerful'],
    melancholic: ['melancholic', 'sad', 'emotional', 'introspective', 'somber'],
    experimental: ['experimental', 'avant-garde', 'innovative', 'boundary-pushing', 'unconventional'],
    soulful: ['soulful', 'soul', 'r&b', 'neo-soul', 'groove'],
    hypnotic: ['hypnotic', 'trance', 'repetitive', 'meditative', 'psychedelic'],
  }

  const normalizedMood = mood.toLowerCase()
  return moodMap[normalizedMood] || [normalizedMood]
}
