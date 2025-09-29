import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PerplexityResponse {
  id: string
  model: string
  created: number
  choices: Array<{
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      artist_name,
      track_name,
      genres = [],
      context = 'similar_artists',
      user_preferences,
      limit = 10
    } = await request.json()

    if (!artist_name) {
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 })
    }

    console.log(`🧠 Generating ${context} recommendations for: ${artist_name}${track_name ? ` - ${track_name}` : ''}`)

    // Get existing relationship data for context
    const relationshipContext = await getArtistRelationshipContext(artist_name)

    // Generate intelligent recommendations using Perplexity
    const recommendations = await generatePerplexityRecommendations({
      artist_name,
      track_name,
      genres,
      context,
      user_preferences,
      relationship_context: relationshipContext,
      limit
    })

    // Enhance recommendations with our database data
    const enhancedRecommendations = await enhanceRecommendationsWithDatabase(recommendations)

    // Store recommendations for future use
    await storeRecommendations(artist_name, track_name, context, enhancedRecommendations)

    return NextResponse.json({
      success: true,
      query: {
        artist_name,
        track_name,
        context,
        limit
      },
      recommendations: enhancedRecommendations,
      metadata: {
        source: 'perplexity_enhanced',
        relationship_context: relationshipContext.summary,
        generated_at: new Date().toISOString(),
        reasoning: recommendations.reasoning
      }
    })

  } catch (error) {
    console.error('Perplexity recommendation error:', error)
    return NextResponse.json({
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artist_name = searchParams.get('artist')
    const track_name = searchParams.get('track')
    const context = searchParams.get('context') || 'similar_artists'

    if (artist_name) {
      // Get cached recommendations
      const cached = await getCachedRecommendations(artist_name, track_name, context)
      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          recommendations: cached.recommendations,
          generated_at: cached.created_at
        })
      }
    }

    return NextResponse.json({
      status: 'ready',
      endpoints: {
        generate_similar_artists: 'POST { artist_name: "Steve Reid", context: "similar_artists", limit: 10 }',
        generate_track_recommendations: 'POST { artist_name: "Steve Reid", track_name: "Lions of Juda", context: "similar_tracks" }',
        generate_genre_exploration: 'POST { artist_name: "Steve Reid", context: "genre_exploration", genres: ["free jazz", "avant-garde"] }',
        generate_collaboration_suggestions: 'POST { artist_name: "Steve Reid", context: "collaboration_potential" }'
      },
      contexts: [
        'similar_artists - Find artists with similar style and sound',
        'similar_tracks - Find tracks similar to a specific song',
        'genre_exploration - Discover artists within specific genres',
        'collaboration_potential - Find artists likely to collaborate well',
        'influence_analysis - Analyze musical influences and connections',
        'discovery_path - Create a journey through related music'
      ],
      features: [
        'AI-powered musical analysis using Perplexity',
        'Real-time web knowledge integration',
        'Relationship context from database',
        'Genre and style understanding',
        'Collaboration potential analysis',
        'Intelligent reasoning for recommendations'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get recommendation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Generate recommendations using Perplexity API
 */
async function generatePerplexityRecommendations({
  artist_name,
  track_name,
  genres,
  context,
  user_preferences,
  relationship_context,
  limit
}: {
  artist_name: string
  track_name?: string
  genres: string[]
  context: string
  user_preferences?: any
  relationship_context: any
  limit: number
}): Promise<{ recommendations: any[], reasoning: string }> {

  const prompt = buildPerplexityPrompt({
    artist_name,
    track_name,
    genres,
    context,
    user_preferences,
    relationship_context,
    limit
  })

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an expert music recommendation system with deep knowledge of musical connections, genres, collaborations, and artist relationships. Provide intelligent, contextual music recommendations with detailed reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data: PerplexityResponse = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Parse the AI response to extract structured recommendations
    const parsed = parsePerplexityResponse(content)

    return {
      recommendations: parsed.recommendations,
      reasoning: parsed.reasoning
    }

  } catch (error) {
    console.error('Perplexity API call failed:', error)
    // Fallback to database-only recommendations
    return await generateFallbackRecommendations(artist_name, context, limit)
  }
}

/**
 * Build the Perplexity prompt based on context
 */
function buildPerplexityPrompt({
  artist_name,
  track_name,
  genres,
  context,
  user_preferences,
  relationship_context,
  limit
}: any): string {
  let basePrompt = ''

  switch (context) {
    case 'similar_artists':
      basePrompt = `Find ${limit} artists similar to ${artist_name}. Consider their musical style, genre, instrumentation, and artistic approach.`
      break
    case 'similar_tracks':
      basePrompt = `Find ${limit} tracks similar to "${track_name}" by ${artist_name}. Focus on musical elements, mood, rhythm, and sonic characteristics.`
      break
    case 'genre_exploration':
      basePrompt = `Recommend ${limit} artists who explore similar genres to ${artist_name}${genres.length ? ` (genres: ${genres.join(', ')})` : ''}.`
      break
    case 'collaboration_potential':
      basePrompt = `Suggest ${limit} artists who would create interesting collaborations with ${artist_name}, based on complementary styles and shared musical interests.`
      break
    case 'influence_analysis':
      basePrompt = `Identify ${limit} artists who either influenced ${artist_name} or were influenced by them. Trace musical lineages and connections.`
      break
    case 'discovery_path':
      basePrompt = `Create a musical discovery path starting from ${artist_name}. Suggest ${limit} artists that create a journey through related but progressively different sounds.`
      break
    default:
      basePrompt = `Recommend ${limit} artists related to ${artist_name}.`
  }

  // Add relationship context if available
  if (relationship_context.connections.length > 0) {
    basePrompt += `\n\nKnown connections: ${artist_name} has worked with: ${relationship_context.connections.slice(0, 5).join(', ')}.`
  }

  // Add user preferences if provided
  if (user_preferences) {
    basePrompt += `\n\nUser preferences: ${JSON.stringify(user_preferences)}`
  }

  basePrompt += `\n\nProvide your response in this JSON format:
{
  "reasoning": "Detailed explanation of your recommendation logic and musical connections",
  "recommendations": [
    {
      "artist_name": "Artist Name",
      "similarity_score": 0.9,
      "connection_type": "style_similarity|collaboration_potential|genre_mate|influence",
      "description": "Brief description of why this artist is recommended",
      "musical_elements": ["element1", "element2"],
      "recommended_tracks": ["track1", "track2"]
    }
  ]
}`

  return basePrompt
}

/**
 * Parse Perplexity AI response into structured data
 */
function parsePerplexityResponse(content: string): { recommendations: any[], reasoning: string } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        recommendations: parsed.recommendations || [],
        reasoning: parsed.reasoning || 'AI-generated recommendations'
      }
    }

    // Fallback: parse text format
    const lines = content.split('\n').filter(line => line.trim())
    const recommendations = []
    let reasoning = 'AI-generated recommendations based on musical analysis'

    // Extract artist names from text
    for (const line of lines) {
      const artistMatch = line.match(/(?:Artist:?\s*)?([A-Z][^,\n]*?)(?:\s*-|$)/)
      if (artistMatch && artistMatch[1]) {
        recommendations.push({
          artist_name: artistMatch[1].trim(),
          similarity_score: 0.8,
          connection_type: 'ai_recommended',
          description: line.trim(),
          musical_elements: [],
          recommended_tracks: []
        })
      }
    }

    return { recommendations: recommendations.slice(0, 10), reasoning }
  } catch (error) {
    console.error('Error parsing Perplexity response:', error)
    return { recommendations: [], reasoning: 'Failed to parse AI response' }
  }
}

/**
 * Generate fallback recommendations using database
 */
async function generateFallbackRecommendations(artistName: string, context: string, limit: number) {
  // Get related artists from our relationship database
  const { data: relationships } = await supabase
    .from('artist_relationships')
    .select(`
      target_artist:artist_profiles!target_artist_id(name, genres),
      relationship_type,
      strength
    `)
    .eq('source_artist.name', artistName)
    .order('strength', { ascending: false })
    .limit(limit)

  const recommendations = (relationships || []).map((rel: any) => ({
    artist_name: rel.target_artist?.name || 'Unknown',
    similarity_score: rel.strength / 10,
    connection_type: rel.relationship_type,
    description: `Related through ${rel.relationship_type} connection`,
    musical_elements: rel.target_artist?.genres || [],
    recommended_tracks: []
  }))

  return {
    recommendations,
    reasoning: 'Database-based recommendations using known artist relationships'
  }
}

/**
 * Get artist relationship context for better recommendations
 */
async function getArtistRelationshipContext(artistName: string) {
  const { data: relationships } = await supabase
    .from('artist_relationships')
    .select(`
      target_artist:artist_profiles!target_artist_id(name),
      relationship_type,
      strength,
      source_data
    `)
    .eq('source_artist.name', artistName)
    .order('strength', { ascending: false })
    .limit(20)

  const connections = (relationships || []).map(rel => rel.target_artist?.name).filter(Boolean)
  const relationshipTypes = [...new Set((relationships || []).map(rel => rel.relationship_type))]

  return {
    connections,
    relationship_types: relationshipTypes,
    total_connections: relationships?.length || 0,
    summary: `${connections.length} known connections including ${relationshipTypes.join(', ')}`
  }
}

/**
 * Enhance recommendations with our database data
 */
async function enhanceRecommendationsWithDatabase(recommendations: any[]) {
  const enhanced = []

  for (const rec of recommendations.recommendations || []) {
    // Check if artist exists in our database
    const { data: artist } = await supabase
      .from('artist_profiles')
      .select('id, name, bio, genres, spotify_id')
      .ilike('name', rec.artist_name)
      .single()

    // Get track data if available
    const { data: tracks } = await supabase
      .from('songs')
      .select('song, artist')
      .ilike('artist', rec.artist_name)
      .limit(3)

    enhanced.push({
      ...rec,
      in_database: !!artist,
      artist_id: artist?.id,
      bio: artist?.bio,
      genres: artist?.genres || rec.musical_elements,
      available_tracks: tracks?.map(t => t.song) || rec.recommended_tracks,
      spotify_id: artist?.spotify_id
    })
  }

  return enhanced
}

/**
 * Store recommendations for caching
 */
async function storeRecommendations(artistName: string, trackName: string | undefined, context: string, recommendations: any[]) {
  try {
    await supabase
      .from('ai_recommendations')
      .upsert({
        artist_name: artistName,
        track_name: trackName,
        context,
        recommendations: JSON.stringify(recommendations),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'artist_name,track_name,context'
      })
  } catch (error) {
    console.error('Error storing recommendations:', error)
  }
}

/**
 * Get cached recommendations
 */
async function getCachedRecommendations(artistName: string, trackName: string | null, context: string) {
  try {
    const query = supabase
      .from('ai_recommendations')
      .select('recommendations, created_at')
      .eq('artist_name', artistName)
      .eq('context', context)

    if (trackName) {
      query.eq('track_name', trackName)
    } else {
      query.is('track_name', null)
    }

    const { data } = await query
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours cache
      .single()

    if (data) {
      return {
        recommendations: JSON.parse(data.recommendations),
        created_at: data.created_at
      }
    }
  } catch (error) {
    console.error('Error getting cached recommendations:', error)
  }

  return null
}