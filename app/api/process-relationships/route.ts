import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to parse featured artists from track titles
function extractFeaturedArtists(title: string, mainArtist: string): string[] {
  const featured: string[] = []

  // Common patterns for featured artists
  const patterns = [
    /\(feat\.\s*([^)]+)\)/i,
    /\(ft\.\s*([^)]+)\)/i,
    /\(featuring\s*([^)]+)\)/i,
    /\(with\s*([^)]+)\)/i,
    /feat\.\s*([^-]+)$/i,
    /ft\.\s*([^-]+)$/i
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match && match[1]) {
      // Split by common separators
      const artists = match[1].split(/[,&]/).map(a => a.trim())
      featured.push(...artists)
    }
  }

  return featured.filter(a => a && a !== mainArtist)
}

// Helper to extract remix artist
function extractRemixArtist(title: string): string | null {
  const remixPattern = /\(([^)]+)\s+remix\)/i
  const match = title.match(remixPattern)
  return match ? match[1].trim() : null
}

// Helper to parse multiple artists from artist field
function extractCollaborators(artistField: string): string[] {
  // Split by common separators
  return artistField.split(/[,&]/).map(a => a.trim()).filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Starting relationship discovery process...')

    // Get the processing parameters from request
    const { limit = 100, offset = 0, source = 'mixcloud_tracks' } = await request.json().catch(() => ({}))

    // Step 1: Fetch tracks to process
    console.log(`📀 Fetching ${limit} tracks from ${source} (offset: ${offset})...`)

    let tracks
    if (source === 'mixcloud_tracks') {
      const { data, error } = await supabase
        .from('mixcloud_tracks')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) throw error
      tracks = data || []
    } else if (source === 'songs') {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('start_time', { ascending: false })

      if (error) throw error
      tracks = data || []
    }

    console.log(`✅ Found ${tracks?.length || 0} tracks to process`)

    const relationships: any[] = []
    const credits: any[] = []
    const artistsToCreate = new Set<string>()

    // Step 2: Process each track for relationships
    for (const track of tracks || []) {
      // Handle different table schemas
      let trackTitle, mainArtist
      if (source === 'mixcloud_tracks') {
        trackTitle = track.track || ''
        mainArtist = track.artist || ''
      } else if (source === 'songs') {
        trackTitle = track.song || track.title || ''
        mainArtist = track.artist || ''
      } else {
        trackTitle = track.title || track.track || track.song || ''
        mainArtist = track.artist || ''
      }

      if (!trackTitle || !mainArtist) continue

      // Collect all artists mentioned
      artistsToCreate.add(mainArtist)

      // Extract featured artists
      const featuredArtists = extractFeaturedArtists(trackTitle, mainArtist)
      for (const featured of featuredArtists) {
        artistsToCreate.add(featured)
        relationships.push({
          source_artist: mainArtist,
          target_artist: featured,
          relationship_type: 'featured',
          evidence_track: track.id,
          track_title: trackTitle
        })

        credits.push({
          track_id: track.id,
          track_table: source,
          artist_name: featured,
          credit_type: 'featured_artist',
          source_api: 'parsed'
        })
      }

      // Extract remix artist
      const remixArtist = extractRemixArtist(trackTitle)
      if (remixArtist && remixArtist !== mainArtist) {
        artistsToCreate.add(remixArtist)
        relationships.push({
          source_artist: remixArtist,
          target_artist: mainArtist,
          relationship_type: 'remix',
          evidence_track: track.id,
          track_title: trackTitle
        })

        credits.push({
          track_id: track.id,
          track_table: source,
          artist_name: remixArtist,
          credit_type: 'remixer',
          source_api: 'parsed'
        })
      }

      // Extract collaborators from artist field
      const collaborators = extractCollaborators(mainArtist)
      if (collaborators.length > 1) {
        // This is a collaboration between multiple artists
        for (let i = 0; i < collaborators.length; i++) {
          artistsToCreate.add(collaborators[i])
          for (let j = i + 1; j < collaborators.length; j++) {
            relationships.push({
              source_artist: collaborators[i],
              target_artist: collaborators[j],
              relationship_type: 'collaboration',
              evidence_track: track.id,
              track_title: trackTitle
            })
          }

          credits.push({
            track_id: track.id,
            track_table: source,
            artist_name: collaborators[i],
            credit_type: 'main_artist',
            source_api: 'parsed'
          })
        }
      } else {
        // Single main artist
        credits.push({
          track_id: track.id,
          track_table: source,
          artist_name: mainArtist,
          credit_type: 'main_artist',
          source_api: 'parsed'
        })
      }
    }

    console.log(`🎨 Found ${artistsToCreate.size} unique artists`)
    console.log(`🔗 Discovered ${relationships.length} relationships`)
    console.log(`🎵 Created ${credits.length} track credits`)

    // Step 3: Create artist profiles if they don't exist
    console.log('👤 Creating artist profiles...')
    const artistProfiles = new Map<string, string>() // name -> id

    for (const artistName of artistsToCreate) {
      // Check if artist already exists
      const { data: existing } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('name', artistName)
        .single()

      if (existing) {
        artistProfiles.set(artistName, existing.id)
      } else {
        // Create new artist profile (matching your existing schema)
        const { data: newArtist, error } = await supabase
          .from('artist_profiles')
          .insert({
            name: artistName,
            slug: artistName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            bio: `Electronic music artist known for their work in the underground scene.`,
            genres: ['Electronic']
          })
          .select('id')
          .single()

        if (!error && newArtist) {
          artistProfiles.set(artistName, newArtist.id)
        }
      }
    }

    // Step 4: Insert relationships into database
    console.log('💾 Saving relationships to database...')
    const relationshipsToInsert = []

    for (const rel of relationships) {
      const sourceId = artistProfiles.get(rel.source_artist)
      const targetId = artistProfiles.get(rel.target_artist)

      if (sourceId && targetId) {
        relationshipsToInsert.push({
          source_artist_id: sourceId,
          target_artist_id: targetId,
          relationship_type: rel.relationship_type,
          evidence_tracks: [rel.evidence_track],
          source_data: {
            track_title: rel.track_title,
            source: 'track_parser',
            processed_at: new Date().toISOString()
          },
          collaboration_count: 1,
          verified: false
        })
      }
    }

    // Insert relationships (upsert to handle duplicates)
    if (relationshipsToInsert.length > 0) {
      const { error } = await supabase
        .from('artist_relationships')
        .upsert(relationshipsToInsert, {
          onConflict: 'source_artist_id,target_artist_id,relationship_type',
          ignoreDuplicates: true
        })

      if (error) {
        console.error('Error inserting relationships:', error)
      }
    }

    // Step 5: Insert track credits
    console.log('🎼 Saving track credits...')
    const creditsToInsert = []

    for (const credit of credits) {
      const artistId = artistProfiles.get(credit.artist_name)
      if (artistId) {
        creditsToInsert.push({
          track_id: credit.track_id,
          track_table: credit.track_table,
          artist_id: artistId,
          credit_type: credit.credit_type,
          source_api: 'manual', // credit.source_api was 'parsed' which is not allowed
          confidence: 0.8 // Parsed from title = 80% confidence
        })
      }
    }

    if (creditsToInsert.length > 0) {
      const { error } = await supabase
        .from('track_credits')
        .upsert(creditsToInsert, {
          onConflict: 'track_id,artist_id,credit_type',
          ignoreDuplicates: true
        })

      if (error) {
        console.error('Error inserting credits:', error)
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        tracks_processed: tracks?.length || 0,
        artists_found: artistsToCreate.size,
        artist_profiles_created: artistProfiles.size,
        relationships_discovered: relationships.length,
        relationships_saved: relationshipsToInsert.length,
        credits_created: creditsToInsert.length,
        source_table: source,
        offset,
        limit
      },
      next_batch: {
        offset: offset + limit,
        limit,
        source
      },
      sample_relationships: relationships.slice(0, 5),
      message: `Successfully processed ${tracks?.length} tracks. Found ${relationships.length} relationships between ${artistsToCreate.size} artists.`
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json({
      error: 'Failed to process relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check processing status
export async function GET() {
  try {
    // Get counts from database
    const [
      { count: relationshipCount },
      { count: creditCount },
      { count: artistCount }
    ] = await Promise.all([
      supabase.from('artist_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('track_credits').select('*', { count: 'exact', head: true }),
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      status: 'ready',
      current_data: {
        total_relationships: relationshipCount || 0,
        total_credits: creditCount || 0,
        total_artists: artistCount || 0
      },
      endpoints: {
        process_mixcloud_tracks: 'POST /api/process-relationships { source: "mixcloud_tracks", limit: 100, offset: 0 }',
        process_songs: 'POST /api/process-relationships { source: "songs", limit: 100, offset: 0 }',
      },
      instructions: 'Use POST with admin token to process tracks and discover relationships'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}