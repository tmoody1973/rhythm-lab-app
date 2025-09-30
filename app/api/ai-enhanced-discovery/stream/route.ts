import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      artist_name,
      track_name,
      force_refresh = false
    } = await request.json()

    if (!artist_name) {
      return new Response('Artist name is required', { status: 400 })
    }

    // Create a ReadableStream for streaming responses
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send data
          const sendUpdate = (type: string, data: any) => {
            const message = `data: ${JSON.stringify({ type, data })}\n\n`
            controller.enqueue(encoder.encode(message))
          }

          // Send initial status
          sendUpdate('status', {
            message: 'Starting AI musical discovery...',
            stage: 'initializing',
            progress: 0
          })

          // Step 1: Check for cached analysis
          let aiRecommendations
          if (!force_refresh) {
            sendUpdate('status', {
              message: 'Checking for cached analysis...',
              stage: 'cache_check',
              progress: 10
            })

            const cachedAnalysis = await getCachedAnalysis(artist_name, track_name, 'full_discovery')
            if (cachedAnalysis) {
              sendUpdate('status', {
                message: 'Found cached analysis!',
                stage: 'cache_found',
                progress: 20
              })
              aiRecommendations = cachedAnalysis
            }
          }

          // Step 2: Generate AI recommendations if not cached
          if (!aiRecommendations) {
            sendUpdate('status', {
              message: 'Generating AI recommendations with Perplexity...',
              stage: 'ai_generation',
              progress: 20
            })

            aiRecommendations = await getStreamingPerplexityRecommendations(
              artist_name,
              track_name,
              sendUpdate
            )

            // Cache the results
            await cacheAnalysis(artist_name, track_name, 'full_discovery', aiRecommendations)

            sendUpdate('status', {
              message: 'AI analysis cached for future use',
              stage: 'caching_complete',
              progress: 80
            })
          }

          // Step 3: Send final results
          sendUpdate('status', {
            message: 'Analysis complete!',
            stage: 'complete',
            progress: 100
          })

          sendUpdate('final_result', {
            success: true,
            ai_recommendations: aiRecommendations,
            artist_name,
            track_name
          })

          // Close the stream
          controller.close()

        } catch (error) {
          console.error('Streaming error:', error)
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            data: {
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              stage: 'error'
            }
          })}\n\n`
          controller.enqueue(encoder.encode(errorMessage))
          controller.close()
        }
      }
    })

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('Stream setup error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * Enhanced Perplexity function that sends streaming updates
 */
async function getStreamingPerplexityRecommendations(
  artistName: string,
  trackName: string | undefined,
  sendUpdate: (type: string, data: any) => void
): Promise<any> {
  const prompt = `
Analyze ${artistName}${trackName ? ` and their track "${trackName}"` : ''} and provide comprehensive music discovery connections.

Output in this EXACT JSON format with detailed connection analysis:

{
  "song": "${trackName || 'General Artist Analysis'}",
  "artist": "${artistName}",
  "reasoning": "Detailed musical analysis explaining the connections and discoveries",
  "connections": [
    {
      "type": "Core Collaboration",
      "details": [
        {
          "artist": "Collaborator Name",
          "group_affiliation": "Band/Group if applicable",
          "role": "Specific role (co-writer, featured vocalist, etc.)",
          "influence": "How this collaboration influenced either artist"
        }
      ]
    },
    {
      "type": "Production & Sampling",
      "details": [
        {
          "name": "Producer/Engineer Name",
          "role": "Specific production role"
        },
        {
          "name": "Sampling",
          "sampled_artist": "Original Artist",
          "sampled_track": "Original Track",
          "sampled_elements": ["specific elements sampled"]
        }
      ]
    },
    {
      "type": "Scene Connections",
      "details": [
        "Other artists from same scene/genre/time period with specific connections"
      ]
    },
    {
      "type": "Influence & Legacy",
      "details": [
        "Artists influenced by this track/artist",
        "Musical movements or genres this helped define",
        "Specific evidence of influence on later artists"
      ]
    }
  ],
  "recommended_artists": [
    {
      "artist_name": "Exact Artist Name",
      "similarity_score": 0.95,
      "connection_type": "collaboration|influence|scene_mate|sampling|production",
      "description": "Specific reason for connection",
      "evidence": "Concrete evidence of connection",
      "time_period": "1970s|1980s|etc",
      "genres": ["genre1", "genre2"],
      "key_albums": ["album1", "album2"],
      "discogs_search_priority": 1-10
    }
  ],
  "discovery_insights": {
    "musical_lineage": "How this artist/track fits into musical history",
    "scene_connections": "Geographic/cultural scene context",
    "api_enhancement_suggestions": ["discogs", "musicbrainz", "spotify"],
    "sampling_potential": "Artists/tracks that might sample this work",
    "remix_culture": "Remix/cover versions and their creators"
  }
}

Focus on factual, verifiable connections. Include specific album names, years, producer credits, collaborations, and influence relationships that can be verified through music databases.`

  try {
    sendUpdate('status', {
      message: 'Contacting Perplexity AI...',
      stage: 'ai_request',
      progress: 30
    })

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
            content: 'You are a music discovery AI that outputs structured JSON for API integration. Focus on accuracy and API-searchable artist names.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7,
        stream: false  // We handle streaming at the API level
      })
    })

    sendUpdate('status', {
      message: 'Received AI response, parsing data...',
      stage: 'ai_parsing',
      progress: 60
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'

    // Log the raw response for debugging
    console.log('Perplexity raw response for', artistName, ':', {
      contentLength: content.length,
      firstChars: content.substring(0, 200),
      lastChars: content.substring(content.length - 200)
    })

    // Extract JSON from response (try to find the outermost braces)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to extract JSON. Raw content:', content)
      throw new Error('No valid JSON found in AI response')
    }

    let parsedResult
    try {
      parsedResult = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse failed. Matched content:', jsonMatch[0])
      throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
    }

    // Send intermediate results as they're processed
    if (parsedResult.recommended_artists?.length > 0) {
      sendUpdate('partial_result', {
        type: 'recommended_artists',
        data: parsedResult.recommended_artists,
        progress: 70
      })
    }

    if (parsedResult.discovery_insights) {
      sendUpdate('partial_result', {
        type: 'discovery_insights',
        data: parsedResult.discovery_insights,
        progress: 75
      })
    }

    return parsedResult

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Streaming Perplexity AI call failed:', {
      artist: artistName,
      track: trackName,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })

    sendUpdate('error', {
      message: 'AI analysis failed, using fallback data',
      error: errorMessage,
      details: {
        artist: artistName,
        track: trackName
      }
    })

    return {
      reasoning: `Fallback recommendations due to AI error: ${errorMessage}`,
      recommended_artists: [],
      discovery_insights: {
        musical_lineage: `Unable to analyze due to error: ${errorMessage}`,
        scene_connections: `Error occurred during analysis: ${errorMessage}`
      }
    }
  }
}

/**
 * Get cached AI analysis from database
 */
async function getCachedAnalysis(artistName: string, trackName: string | undefined, analysisType: string): Promise<any | null> {
  try {
    const query = supabase
      .from('ai_recommendations')
      .select('recommendations, created_at')
      .eq('artist_name', artistName)
      .eq('context', analysisType)

    if (trackName) {
      query.eq('track_name', trackName)
    } else {
      query.is('track_name', null)
    }

    const { data } = await query.single()

    if (data) {
      const cachedData = typeof data.recommendations === 'string'
        ? JSON.parse(data.recommendations)
        : data.recommendations

      return cachedData
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Cache AI analysis results for future use
 */
async function cacheAnalysis(artistName: string, trackName: string | undefined, analysisType: string, analysis: any): Promise<void> {
  try {
    await supabase
      .from('ai_recommendations')
      .upsert({
        artist_name: artistName,
        track_name: trackName,
        context: analysisType,
        recommendations: JSON.stringify(analysis),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'artist_name,track_name,context'
      })
  } catch (error) {
    console.error('Error caching analysis:', error)
  }
}