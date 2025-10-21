/**
 * Thesys C1 Chat API Endpoint
 *
 * This endpoint handles chat messages from users and uses Thesys C1
 * to generate interactive UI responses with music discovery data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createThesysClient, MUSIC_DISCOVERY_SYSTEM_PROMPT, DEFAULT_C1_CONFIG } from '@/lib/thesys/config'
import { allMusicTools, TOOL_NAMES } from '@/lib/ai/tools'
import {
  searchArtistsByGenre,
  getArtistProfile,
  getSimilarArtists,
  searchArtistsByName,
} from '@/lib/storyblok/ai-queries'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Initialize Thesys C1 client
    const client = createThesysClient()

    // Prepare messages with system prompt
    const chatMessages = [
      {
        role: 'system' as const,
        content: MUSIC_DISCOVERY_SYSTEM_PROMPT,
      },
      ...messages,
    ]

    // Handle tool calls in a loop until we get a final response
    let currentMessages = chatMessages
    let maxIterations = 5 // Prevent infinite loops
    let iterations = 0

    while (iterations < maxIterations) {
      iterations++

      const response = await client.chat.completions.create({
        ...DEFAULT_C1_CONFIG,
        messages: currentMessages,
        tools: allMusicTools,
      })

      const choice = response.choices[0]

      // If no tool calls, return the final response
      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        return NextResponse.json({
          content: choice.message.content || '',
          role: 'assistant',
        })
      }

      // Execute all tool calls
      const toolResults = []
      for (const toolCall of choice.message.tool_calls) {
        const functionName = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)

        console.log(`[AI] Calling tool: ${functionName}`, args)
        const result = await executeTool(functionName, args, userId)
        console.log(`[AI] Tool result:`, result)

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          name: functionName,
          content: JSON.stringify(result),
        })
      }

      // Add assistant message with tool calls and tool results to conversation
      currentMessages = [
        ...currentMessages,
        choice.message,
        ...toolResults,
      ]
    }

    // If we hit max iterations, return error
    return NextResponse.json(
      { error: 'Max tool call iterations reached' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('[AI] Chat error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * Execute a tool based on its name
 */
async function executeTool(
  toolName: string,
  args: any,
  userId?: string
): Promise<any> {
  switch (toolName) {
    case TOOL_NAMES.SEARCH_ARTISTS_BY_GENRE:
      return await searchArtistsByGenre(
        args.genres || [],
        args.mood,
        args.limit || 6
      )

    case TOOL_NAMES.GET_ARTIST_PROFILE:
      return await getArtistProfile(args.artistSlug)

    case TOOL_NAMES.GET_SIMILAR_ARTISTS:
      return await getSimilarArtists(args.artistSlug, args.limit || 5)

    case TOOL_NAMES.SEARCH_ARTISTS_BY_NAME:
      return await searchArtistsByName(args.query, args.limit || 10)

    case TOOL_NAMES.GET_USER_FAVORITES:
      // TODO: Implement Supabase query
      return {
        message: 'User favorites feature coming soon',
        favorites: [],
      }

    case TOOL_NAMES.SAVE_TO_FAVORITES:
      // TODO: Implement Supabase mutation
      return {
        success: true,
        message: 'Favorite saving feature coming soon',
      }

    default:
      console.warn(`[AI] Unknown tool: ${toolName}`)
      return { error: 'Unknown tool' }
  }
}
