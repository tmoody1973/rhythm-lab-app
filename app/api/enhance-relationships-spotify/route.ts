import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  searchSpotifyArtist,
  getSpotifyRelatedArtists,
  getSpotifyArtistCollaborations
} from '@/lib/spotify/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🎵 Starting Spotify relationship enhancement...')

    const { limit = 50, offset = 0 } = await request.json().catch(() => ({}))

    // Get existing artist profiles that don't have Spotify data yet
    const { data: artists, error } = await supabase
      .from('artist_profiles')
      .select('id, name, spotify_id')
      .is('spotify_id', null) // Only process artists without Spotify IDs
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log(`Found ${artists?.length || 0} artists to enhance with Spotify data`)

    let enhancedCount = 0
    let relationshipsCreated = 0
    const newRelationships: any[] = []

    for (const artist of artists || []) {
      try {
        console.log(`🔍 Searching Spotify for: ${artist.name}`)

        // Search for artist on Spotify
        const spotifyArtist = await searchSpotifyArtist(artist.name)

        if (!spotifyArtist) {
          console.log(`❌ Artist not found on Spotify: ${artist.name}`)
          continue
        }

        console.log(`✅ Found on Spotify: ${artist.name} (ID: ${spotifyArtist.id})`)

        // Update artist profile with Spotify ID
        await supabase
          .from('artist_profiles')
          .update({
            spotify_id: spotifyArtist.id,
            genres: spotifyArtist.genres || []
          })
          .eq('id', artist.id)

        enhancedCount++

        // Get related artists from Spotify
        const relatedArtists = await getSpotifyRelatedArtists(spotifyArtist.id)

        console.log(`Found ${relatedArtists.length} related artists for ${artist.name}`)

        // Process related artists
        for (const relatedArtist of relatedArtists.slice(0, 10)) { // Limit to top 10
          try {
            // Check if related artist exists in our database
            let { data: existingArtist } = await supabase
              .from('artist_profiles')
              .select('id')
              .eq('name', relatedArtist.name)
              .single()

            // Create artist profile if doesn't exist
            if (!existingArtist) {
              const { data: newArtist } = await supabase
                .from('artist_profiles')
                .insert({
                  name: relatedArtist.name,
                  slug: relatedArtist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                  bio: `Electronic music artist related to ${artist.name} through Spotify's algorithm.`,
                  genres: relatedArtist.genres || [],
                  spotify_id: relatedArtist.id
                })
                .select('id')
                .single()

              if (newArtist) {
                existingArtist = newArtist
              }
            }

            if (existingArtist) {
              // Create relationship
              const relationship = {
                source_artist_id: artist.id,
                target_artist_id: existingArtist.id,
                relationship_type: 'influence',
                strength: Math.min(relatedArtist.popularity / 20, 10), // Convert popularity (0-100) to strength (0-10)
                source_data: {
                  source: 'spotify_related_artists',
                  spotify_artist_id: spotifyArtist.id,
                  related_artist_id: relatedArtist.id,
                  popularity: relatedArtist.popularity,
                  genres: relatedArtist.genres,
                  processed_at: new Date().toISOString()
                },
                collaboration_count: 0, // This is influence, not direct collaboration
                verified: false
              }

              newRelationships.push(relationship)
            }
          } catch (err) {
            console.error(`Error processing related artist ${relatedArtist.name}:`, err)
          }
        }

        // Get collaborations from Spotify
        try {
          const collaborations = await getSpotifyArtistCollaborations(spotifyArtist.id)
          console.log(`Found ${collaborations.length} collaborations for ${artist.name}`)

          for (const collab of collaborations.slice(0, 5)) { // Limit to 5 collaborations
            // Similar process for collaborations...
            // This would create 'collaboration' type relationships
          }
        } catch (err) {
          console.error(`Error getting collaborations for ${artist.name}:`, err)
        }

        // Small delay to respect Spotify rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (err) {
        console.error(`Error processing artist ${artist.name}:`, err)
      }
    }

    // Insert relationships in batch
    if (newRelationships.length > 0) {
      const { error: insertError } = await supabase
        .from('artist_relationships')
        .upsert(newRelationships, {
          onConflict: 'source_artist_id,target_artist_id,relationship_type',
          ignoreDuplicates: true
        })

      if (insertError) {
        console.error('Error inserting Spotify relationships:', insertError)
      } else {
        relationshipsCreated = newRelationships.length
        console.log(`✅ Created ${relationshipsCreated} new influence relationships`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        artists_processed: artists?.length || 0,
        artists_enhanced: enhancedCount,
        relationships_created: relationshipsCreated,
        offset,
        limit
      },
      next_batch: {
        offset: offset + limit,
        limit
      },
      message: `Enhanced ${enhancedCount} artists with Spotify data and created ${relationshipsCreated} influence relationships.`
    })

  } catch (error) {
    console.error('Spotify enhancement error:', error)
    return NextResponse.json({
      error: 'Failed to enhance relationships with Spotify data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get counts from database
    const [
      { count: totalArtists },
      { count: artistsWithSpotify },
      { count: influenceRelationships }
    ] = await Promise.all([
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true }).not('spotify_id', 'is', null),
      supabase.from('artist_relationships').select('*', { count: 'exact', head: true }).eq('relationship_type', 'influence')
    ])

    return NextResponse.json({
      status: 'ready',
      current_data: {
        total_artists: totalArtists || 0,
        artists_with_spotify: artistsWithSpotify || 0,
        influence_relationships: influenceRelationships || 0,
        enhancement_progress: `${artistsWithSpotify || 0}/${totalArtists || 0}`
      },
      endpoints: {
        enhance_relationships: 'POST /api/enhance-relationships-spotify { limit: 50, offset: 0 }'
      },
      instructions: 'Use POST with admin token to enhance artist relationships using Spotify Related Artists API'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get enhancement status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}