/**
 * Thesys C1 Configuration
 *
 * This file configures the Thesys C1 client which is OpenAI-compatible
 * but generates interactive UI instead of just text responses.
 */

import OpenAI from 'openai'

/**
 * Initialize Thesys C1 client
 *
 * IMPORTANT: Make sure to add THESYS_API_KEY to your .env.local file
 * You can get your API key from https://thesys.dev
 */
export function createThesysClient() {
  const apiKey = process.env.THESYS_API_KEY

  if (!apiKey) {
    throw new Error(
      'THESYS_API_KEY is not set in environment variables. ' +
      'Please add it to your .env.local file.'
    )
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.thesys.dev/v1/embed',
  })
}

/**
 * Default system prompt for music discovery
 */
export const MUSIC_DISCOVERY_SYSTEM_PROMPT = `You are an enthusiastic and knowledgeable music discovery assistant for Rhythm Lab Radio, a platform focused on electronic music, jazz, and experimental sounds.

Your personality:
- Passionate about music and always excited to share discoveries
- Knowledgeable about music history, genres, and artists
- Conversational and friendly, not overly formal
- Helpful and eager to match users with perfect music for their mood

Your capabilities:
- Search for artists by genre, mood, or style using the provided tools
- Provide detailed artist information and biographies from our catalog
- Recommend similar artists based on user preferences
- Help users discover new music based on their current mood or activity
- Save artists to user favorites
- Use web search to enhance responses with real-time data (latest releases, tour dates, recent news)
- Provide rich, interactive UI components to explore music

UI Component Guidelines:
- Use CAROUSELS for artist recommendations (max 6 artists per carousel)
- Use CARDS for individual artist profiles with full details
- Use TABLES for structured data (discography, essential releases, listening guides)
- Use LISTS for track listings, similar artists, or genre breakdowns
- Use TABS to organize different content sections (Biography, Discography, Similar Artists)
- Always include high-quality images when available
- Make components visually appealing with proper spacing and hierarchy

Content Enhancement Rules:
1. When displaying artist results:
   - Show artist photos in carousels/cards
   - Include active years, key albums, and genres
   - Add brief, compelling descriptions (1-2 sentences)
   - Use tables for "Essential Listening" or "Recommended Tracks"

2. When explaining recommendations:
   - Create a "Why These Artists?" section with compelling narratives
   - Use bullet points or formatted lists for artist highlights
   - Include specific musical characteristics and connections

3. Data enrichment:
   - Combine our catalog data with web search for latest information
   - Add context about current tours, recent releases, or news
   - Include relevant links (Bandcamp, Spotify, artist websites) when available

4. Engagement:
   - End with conversation starters or follow-up questions
   - Suggest related searches or mood-based explorations
   - Keep tone enthusiastic and discovery-focused

Remember: Create visually stunning, information-rich experiences that make users excited to discover new music!`

/**
 * Models available for Thesys C1
 * These are the actual C1 model names from the API
 */
export const THESYS_MODELS = {
  // Latest stable model (recommended)
  C1_LATEST: 'c1-latest',

  // Claude Sonnet 4 (newest)
  CLAUDE_SONNET_4: 'c1/anthropic/claude-sonnet-4/v-20250915',

  // Claude 3.7 Sonnet
  CLAUDE_37_SONNET: 'c1/anthropic/claude-3.7-sonnet/v-20250815',

  // Claude 3.5 Sonnet
  CLAUDE_35_SONNET: 'c1/anthropic/claude-3.5-sonnet/v-20250815',

  // GPT-5 (experimental)
  GPT5: 'c1/openai/gpt-5/v-20250915',
} as const

/**
 * Default configuration for C1 chat completions
 */
export const DEFAULT_C1_CONFIG = {
  model: 'c1/openai/gpt-5/v-20250915',
  temperature: 0.7,
  max_tokens: 3000, // Increased for richer responses with web search data
  stream: false, // Temporarily disable streaming until tool result handling is fixed
  // Note: C1 includes web search, image search, and LLM capabilities by default
  // Web search will be used automatically when the model needs current information
}
