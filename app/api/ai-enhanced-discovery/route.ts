import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 10 requests per minute (generous for AI operations)
    const identifier = getRateLimitIdentifier(request)
    const rateLimit = checkRateLimit(identifier, {
      limit: 10,
      window: 60000 // 1 minute
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime)
        }
      )
    }

    // Check admin auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      artist_name,
      track_name,
      discovery_type = 'full_analysis',
      auto_enhance = true,
      force_refresh = false
    } = await request.json()

    if (!artist_name) {
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 })
    }

    console.log(`🤖 Starting AI-enhanced discovery for: ${artist_name}`)

    const results = {
      artist_name,
      track_name,
      discovery_type,
      steps_completed: [],
      ai_recommendations: null,
      discogs_enhanced: null,
      relationships_created: 0,
      new_artists_discovered: 0,
      error_log: []
    }

    try {
      // Step 1: Check for cached AI analysis first (unless force refresh is requested)
      let aiRecommendations
      let cachedAnalysis = null

      if (!force_refresh) {
        console.log('🧠 Step 1: Checking for cached AI analysis...')
        cachedAnalysis = await getCachedAnalysis(artist_name, track_name, 'full_discovery')
      } else {
        console.log('🔄 Force refresh requested, skipping cache check')
      }

      if (cachedAnalysis && !force_refresh) {
        console.log('✅ Using cached AI analysis')
        aiRecommendations = cachedAnalysis
      } else {
        console.log('🧠 Generating new AI recommendations...')
        aiRecommendations = await getPerplexityRecommendations(artist_name, track_name)

        // Cache the results for future use
        await cacheAnalysis(artist_name, track_name, 'full_discovery', aiRecommendations)
        console.log('💾 Cached AI analysis for future use')
      }

      results.ai_recommendations = aiRecommendations
      results.steps_completed.push('ai_recommendations')

      const artistsToEnhance = aiRecommendations.recommended_artists || aiRecommendations.recommendations || []
      if (auto_enhance && artistsToEnhance.length > 0) {
        // Step 2: Auto-enhance discovered artists with Discogs
        console.log('🎵 Step 2: Auto-enhancing with Discogs...')
        const discogsResults = await autoEnhanceWithDiscogs(artistsToEnhance)
        results.discogs_enhanced = discogsResults
        results.steps_completed.push('discogs_enhancement')

        // Step 3: Create cross-API relationships
        console.log('🔗 Step 3: Creating AI→API relationships...')
        const crossApiResults = await createCrossApiRelationships(
          artist_name,
          aiRecommendations.recommendations,
          discogsResults
        )
        results.relationships_created = crossApiResults.relationships_created
        results.new_artists_discovered = crossApiResults.new_artists_discovered
        results.steps_completed.push('cross_api_relationships')
      }

    } catch (stepError) {
      results.error_log.push({
        step: results.steps_completed.length + 1,
        error: stepError instanceof Error ? stepError.message : 'Unknown error'
      })
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total_steps: results.steps_completed.length,
        ai_recommendations: (results.ai_recommendations?.recommended_artists?.length || results.ai_recommendations?.recommendations?.length || 0),
        ai_connections: results.ai_recommendations?.connections?.length || 0,
        relationships_created: results.relationships_created,
        new_artists_discovered: results.new_artists_discovered,
        processing_time: new Date().toISOString()
      },
      next_actions: generateNextActions(results)
    })

  } catch (error) {
    console.error('AI-enhanced discovery error:', error)
    return NextResponse.json({
      error: 'Failed to perform AI-enhanced discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    description: 'AI-Enhanced Music Discovery Pipeline',
    capabilities: [
      'Perplexity AI recommendation generation',
      'Automatic Discogs API enhancement',
      'Cross-API relationship creation',
      'Intelligent artist discovery',
      'Real-time knowledge integration',
      'Structured data output for APIs'
    ],
    workflow: [
      '1. AI Analysis: Perplexity generates intelligent recommendations',
      '2. API Enhancement: Auto-query Discogs for discovered artists',
      '3. Relationship Creation: Build connections between AI discoveries and API data',
      '4. Database Integration: Store enhanced relationships',
      '5. Feedback Loop: Use discoveries to improve future recommendations'
    ],
    endpoints: {
      full_discovery: 'POST { artist_name: "Steve Reid", discovery_type: "full_analysis", auto_enhance: true }',
      ai_only: 'POST { artist_name: "Steve Reid", discovery_type: "ai_only", auto_enhance: false }',
      track_analysis: 'POST { artist_name: "Steve Reid", track_name: "Lions of Juda", discovery_type: "track_focus" }'
    }
  })
}

/**
 * Get structured recommendations from Perplexity AI
 */
async function getPerplexityRecommendations(artistName: string, trackName?: string): Promise<any> {
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
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Perplexity API error: ${response.status} - ${errorText}`)
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error('No valid JSON found in AI response')

  } catch (error) {
    console.error('Perplexity AI call failed:', error)
    return {
      reasoning: 'Fallback recommendations due to AI error',
      recommendations: [],
      discovery_insights: {
        musical_lineage: 'Unable to analyze',
        scene_connections: 'Error occurred',
        api_enhancement_suggestions: ['discogs']
      }
    }
  }
}

/**
 * Auto-enhance AI recommendations with Discogs API
 */
async function autoEnhanceWithDiscogs(recommendations: any[]): Promise<any> {
  const enhanced = []
  let apiCallsUsed = 0
  const maxApiCalls = 10 // Rate limiting

  for (const rec of recommendations.slice(0, maxApiCalls)) {
    try {
      console.log(`🔍 Discogs search for: ${rec.artist_name}`)

      // Search Discogs for the artist
      const searchResponse = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(rec.artist_name)}&type=artist&per_page=3`,
        {
          headers: {
            'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
            'User-Agent': 'RhythmLabRadio/1.0'
          }
        }
      )

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        const artistResults = searchData.results || []

        // Get detailed artist info
        if (artistResults.length > 0) {
          const artistId = artistResults[0].id
          const artistResponse = await fetch(
            `https://api.discogs.com/artists/${artistId}`,
            {
              headers: {
                'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
                'User-Agent': 'RhythmLabRadio/1.0'
              }
            }
          )

          if (artistResponse.ok) {
            const artistData = await artistResponse.json()
            enhanced.push({
              ai_recommendation: rec,
              discogs_data: {
                id: artistData.id,
                name: artistData.name,
                profile: artistData.profile,
                members: artistData.members || [],
                groups: artistData.groups || [],
                aliases: artistData.aliases || [],
                releases_count: artistData.releases_url ? 'available' : 'none',
                urls: artistData.urls || [],
                images: artistData.images || []
              },
              enhancement_success: true
            })

            console.log(`✅ Enhanced ${rec.artist_name} with Discogs data`)
          }
        }
      }

      apiCallsUsed++
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))

    } catch (error) {
      console.error(`Error enhancing ${rec.artist_name} with Discogs:`, error)
      enhanced.push({
        ai_recommendation: rec,
        discogs_data: null,
        enhancement_success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return {
    enhanced_artists: enhanced,
    total_processed: enhanced.length,
    api_calls_used: apiCallsUsed,
    success_rate: enhanced.filter(e => e.enhancement_success).length / enhanced.length
  }
}

/**
 * Create relationships between AI discoveries and API data
 */
async function createCrossApiRelationships(
  originalArtist: string,
  aiRecommendations: any[],
  discogsData: any
): Promise<any> {
  let relationshipsCreated = 0
  let newArtistsDiscovered = 0
  const relationshipDetails = []

  // Find or create original artist profile
  const originalArtistId = await findOrCreateArtistProfile({
    name: originalArtist,
    source: 'ai_discovery_origin'
  })

  if (!originalArtistId) {
    return { relationships_created: 0, new_artists_discovered: 0, details: [] }
  }

  for (const enhanced of discogsData.enhanced_artists) {
    if (!enhanced.enhancement_success) continue

    const aiRec = enhanced.ai_recommendation
    const discogsInfo = enhanced.discogs_data

    try {
      // Create artist profile with enhanced data
      const artistProfile = {
        name: discogsInfo.name,
        bio: discogsInfo.profile || `${aiRec.description} (Discovered via AI analysis)`,
        genres: aiRec.genres || [],
        discogs_id: discogsInfo.id,
        source: 'ai_discogs_enhanced'
      }

      const artistId = await findOrCreateArtistProfile(artistProfile)
      if (artistId) {
        newArtistsDiscovered++

        // Create AI-derived relationship
        const relationship = {
          source_artist_id: originalArtistId,
          target_artist_id: artistId,
          relationship_type: mapConnectionTypeToRelationshipType(aiRec.connection_type),
          strength: Math.round(aiRec.similarity_score * 10),
          source_data: {
            source: 'ai_discogs_cross_api',
            ai_reasoning: aiRec.description,
            connection_type: aiRec.connection_type,
            discogs_id: discogsInfo.id,
            perplexity_score: aiRec.similarity_score,
            processed_at: new Date().toISOString()
          },
          collaboration_count: 0,
          verified: false,
          notes: `AI-discovered connection: ${aiRec.description}`
        }

        const { error } = await supabase
          .from('artist_relationships')
          .insert(relationship)

        if (!error) {
          relationshipsCreated++
          relationshipDetails.push({
            target_artist: discogsInfo.name,
            connection_type: aiRec.connection_type,
            strength: relationship.strength,
            discogs_enhanced: true
          })
        }

        // Create relationships for Discogs band members/groups
        if (discogsInfo.members?.length > 0) {
          for (const member of discogsInfo.members.slice(0, 3)) { // Limit to 3 members
            const memberArtistId = await findOrCreateArtistProfile({
              name: member.name,
              source: 'discogs_band_member'
            })

            if (memberArtistId && memberArtistId !== artistId) {
              const memberRelationship = {
                source_artist_id: artistId,
                target_artist_id: memberArtistId,
                relationship_type: 'group_member',
                strength: 8,
                source_data: {
                  source: 'discogs_via_ai_discovery',
                  parent_band: discogsInfo.name,
                  member_active: member.active || true
                },
                collaboration_count: 1,
                verified: false
              }

              await supabase
                .from('artist_relationships')
                .insert(memberRelationship)

              relationshipsCreated++
            }
          }
        }
      }

    } catch (error) {
      console.error(`Error creating relationships for ${discogsInfo.name}:`, error)
    }
  }

  return {
    relationships_created: relationshipsCreated,
    new_artists_discovered: newArtistsDiscovered,
    details: relationshipDetails
  }
}

/**
 * Map AI connection types to database relationship types
 */
function mapConnectionTypeToRelationshipType(connectionType: string): string {
  const mapping: Record<string, string> = {
    'direct_influence': 'influence',
    'style_similarity': 'influence',
    'genre_mate': 'collaboration',
    'collaboration_potential': 'collaboration',
    'historical_connection': 'influence',
    'contemporary': 'collaboration',
    'session_musician': 'musician',
    'producer_connection': 'producer'
  }

  return mapping[connectionType] || 'collaboration'
}

/**
 * Enhanced artist profile creation
 */
async function findOrCreateArtistProfile(artistData: any): Promise<string | null> {
  if (!artistData?.name) return null

  const name = artistData.name.trim()
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Try to find existing artist
  let { data: existingArtist } = await supabase
    .from('artist_profiles')
    .select('id')
    .eq('name', name)
    .single()

  if (existingArtist) {
    return existingArtist.id
  }

  // Create new artist profile with enhanced data
  const { data: newArtist, error } = await supabase
    .from('artist_profiles')
    .insert({
      name,
      slug,
      bio: artistData.bio || `Artist discovered through AI-enhanced discovery.`,
      genres: artistData.genres || [],
      discogs_id: artistData.discogs_id || null,
      created_via: artistData.source || 'ai_enhanced_discovery'
    })
    .select('id')
    .single()

  if (error) {
    console.error(`Error creating artist profile for ${name}:`, error)
    return null
  }

  return newArtist?.id || null
}

/**
 * Generate next actions based on results
 */
function generateNextActions(results: any): string[] {
  const actions = []

  if (results.ai_recommendations?.recommendations?.length > 0) {
    actions.push('✅ AI recommendations generated successfully')
  }

  if (results.relationships_created > 0) {
    actions.push(`✅ Created ${results.relationships_created} new relationships`)
  }

  if (results.new_artists_discovered > 0) {
    actions.push(`✅ Discovered ${results.new_artists_discovered} new artists`)
  }

  if (results.error_log.length > 0) {
    actions.push(`⚠️ ${results.error_log.length} errors occurred - check logs`)
  }

  actions.push('🔄 Run with different artists to expand the network')
  actions.push('📊 Check influence graph for new connections')

  return actions
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
      // Parse the cached analysis
      const cachedData = typeof data.recommendations === 'string'
        ? JSON.parse(data.recommendations)
        : data.recommendations

      console.log(`🎯 Found cached analysis for ${artistName}${trackName ? ` - ${trackName}` : ''} from ${data.created_at}`)
      return cachedData
    }

    return null
  } catch (error) {
    console.log(`📝 No cached analysis found for ${artistName}${trackName ? ` - ${trackName}` : ''}, will generate new`)
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

    console.log(`💾 Cached analysis for ${artistName}${trackName ? ` - ${trackName}` : ''}`)
  } catch (error) {
    console.error('Error caching analysis:', error)
    // Don't throw error, caching failure shouldn't break the main flow
  }
}