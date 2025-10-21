/**
 * AI Tool Definitions for Thesys C1
 *
 * These are function definitions that the AI can call to fetch data.
 * When the AI needs specific information, it will call these tools
 * and we execute them on our backend.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions'

/**
 * Music Discovery Tools
 * These tools help the AI search for and retrieve artist information
 */
export const musicDiscoveryTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'searchArtistsByGenre',
      description: 'Search for artists in the Rhythm Lab Radio catalog by genre, mood, or style. Returns artist profiles with photos, bios, and links.',
      parameters: {
        type: 'object',
        properties: {
          genres: {
            type: 'array',
            items: { type: 'string' },
            description: 'Music genres to search for (e.g., ["jazz", "electronic", "experimental"]). Can include multiple genres.',
          },
          mood: {
            type: 'string',
            description: 'The mood or vibe to match (e.g., "chill", "energetic", "dark", "uplifting", "melancholic"). Optional.',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of artists to return. Default is 6.',
            default: 6,
          },
        },
        required: ['genres'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getArtistProfile',
      description: 'Get detailed information about a specific artist including full biography, discography, and related artists.',
      parameters: {
        type: 'object',
        properties: {
          artistSlug: {
            type: 'string',
            description: 'The URL slug of the artist profile (e.g., "artist-profile-floating-points")',
          },
        },
        required: ['artistSlug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSimilarArtists',
      description: 'Find artists similar to a given artist based on genre, style, and influences.',
      parameters: {
        type: 'object',
        properties: {
          artistSlug: {
            type: 'string',
            description: 'The URL slug of the artist to find similar artists for',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of similar artists to return. Default is 5.',
            default: 5,
          },
        },
        required: ['artistSlug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchArtistsByName',
      description: 'Search for artists by name or partial name match.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The artist name or partial name to search for',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return. Default is 10.',
            default: 10,
          },
        },
        required: ['query'],
      },
    },
  },
]

/**
 * User Preference Tools
 * These tools help manage user favorites and preferences
 */
export const userPreferenceTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getUserFavorites',
      description: 'Get the list of artists that the user has favorited.',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'The ID of the user',
          },
        },
        required: ['userId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'saveToFavorites',
      description: 'Save an artist to the user\'s favorites list.',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'The ID of the user',
          },
          artistId: {
            type: 'string',
            description: 'The ID of the artist to save',
          },
          artistSlug: {
            type: 'string',
            description: 'The URL slug of the artist',
          },
        },
        required: ['userId', 'artistId', 'artistSlug'],
      },
    },
  },
]

/**
 * All tools combined
 * Export this when you want to make all tools available to the AI
 */
export const allMusicTools: ChatCompletionTool[] = [
  ...musicDiscoveryTools,
  ...userPreferenceTools,
]

/**
 * Tool name constants for type safety
 */
export const TOOL_NAMES = {
  SEARCH_ARTISTS_BY_GENRE: 'searchArtistsByGenre',
  GET_ARTIST_PROFILE: 'getArtistProfile',
  GET_SIMILAR_ARTISTS: 'getSimilarArtists',
  SEARCH_ARTISTS_BY_NAME: 'searchArtistsByName',
  GET_USER_FAVORITES: 'getUserFavorites',
  SAVE_TO_FAVORITES: 'saveToFavorites',
} as const

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES]
