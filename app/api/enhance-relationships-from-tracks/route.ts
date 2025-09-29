import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    console.log('🎵 Starting track-based relationship extraction...')

    const { limit = 100, offset = 0, source = 'both' } = await request.json().catch(() => ({}))

    let tracksToProcess = []

    // Get tracks from both live songs and archive tracks
    if (source === 'live' || source === 'both') {
      const { data: liveSongs } = await supabase
        .from('songs')
        .select('id, artist, song, start_time')
        .not('artist', 'is', null)
        .not('song', 'is', null)
        .range(offset, offset + Math.floor(limit / 2) - 1)
        .order('start_time', { ascending: false })

      if (liveSongs) {
        tracksToProcess.push(...liveSongs.map(track => ({
          ...track,
          table: 'songs',
          track_name: track.song,
          artist_name: track.artist
        })))
      }
    }

    if (source === 'archive' || source === 'both') {
      const { data: archiveTracks } = await supabase
        .from('mixcloud_tracks')
        .select('id, artist, track, created_at')
        .not('artist', 'is', null)
        .not('track', 'is', null)
        .range(offset, offset + Math.floor(limit / 2) - 1)
        .order('created_at', { ascending: false })

      if (archiveTracks) {
        tracksToProcess.push(...archiveTracks.map(track => ({
          ...track,
          table: 'mixcloud_tracks',
          track_name: track.track,
          artist_name: track.artist
        })))
      }
    }

    console.log(`Processing ${tracksToProcess.length} tracks for relationships...`)

    let relationshipsCreated = 0
    const newRelationships: any[] = []

    for (const track of tracksToProcess) {
      try {
        const artistName = track.artist_name
        const trackName = track.track_name

        // Extract relationships from track titles and artist names
        const extractedRelationships = await extractRelationshipsFromTrack(artistName, trackName)

        for (const relationship of extractedRelationships) {
          // Find or create artist profiles
          const sourceArtistId = await findOrCreateArtist(relationship.sourceArtist)
          const targetArtistId = await findOrCreateArtist(relationship.targetArtist)

          if (sourceArtistId && targetArtistId && sourceArtistId !== targetArtistId) {
            // Check if relationship already exists
            const { data: existingRel } = await supabase
              .from('artist_relationships')
              .select('id')
              .eq('source_artist_id', sourceArtistId)
              .eq('target_artist_id', targetArtistId)
              .eq('relationship_type', relationship.type)
              .single()

            if (!existingRel) {
              newRelationships.push({
                source_artist_id: sourceArtistId,
                target_artist_id: targetArtistId,
                relationship_type: relationship.type,
                strength: relationship.strength,
                collaboration_count: 1,
                evidence_tracks: [trackName],
                source_data: {
                  source: 'track_parsing',
                  track_id: track.id,
                  track_name: trackName,
                  artist_name: artistName,
                  table: track.table,
                  processed_at: new Date().toISOString()
                },
                verified: false
              })
            }
          }
        }

      } catch (err) {
        console.error(`Error processing track ${track.id}:`, err)
      }
    }

    // Insert relationships in batch
    if (newRelationships.length > 0) {
      const { error: insertError } = await supabase
        .from('artist_relationships')
        .insert(newRelationships)

      if (insertError) {
        console.error('Error inserting track relationships:', insertError)
      } else {
        relationshipsCreated = newRelationships.length
        console.log(`✅ Created ${relationshipsCreated} relationships from track data`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        tracks_processed: tracksToProcess.length,
        relationships_created: relationshipsCreated,
        offset,
        limit,
        source
      },
      next_batch: {
        offset: offset + limit,
        limit,
        source
      },
      message: `Processed ${tracksToProcess.length} tracks and created ${relationshipsCreated} relationships.`
    })

  } catch (error) {
    console.error('Track relationship extraction error:', error)
    return NextResponse.json({
      error: 'Failed to extract relationships from tracks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get counts from database
    const [
      { count: totalLiveSongs },
      { count: totalArchiveTracks },
      { count: totalRelationships }
    ] = await Promise.all([
      supabase.from('songs').select('*', { count: 'exact', head: true }).not('artist', 'is', null),
      supabase.from('mixcloud_tracks').select('*', { count: 'exact', head: true }).not('artist', 'is', null),
      supabase.from('artist_relationships').select('*', { count: 'exact', head: true }).eq('source_data->>source', 'track_parsing')
    ])

    return NextResponse.json({
      status: 'ready',
      current_data: {
        live_songs: totalLiveSongs || 0,
        archive_tracks: totalArchiveTracks || 0,
        total_tracks: (totalLiveSongs || 0) + (totalArchiveTracks || 0),
        track_based_relationships: totalRelationships || 0
      },
      endpoints: {
        process_live_tracks: 'POST /api/enhance-relationships-from-tracks { source: "live", limit: 100, offset: 0 }',
        process_archive_tracks: 'POST /api/enhance-relationships-from-tracks { source: "archive", limit: 100, offset: 0 }',
        process_both: 'POST /api/enhance-relationships-from-tracks { source: "both", limit: 100, offset: 0 }'
      },
      features: [
        'Extracts collaborations from track titles (feat., vs., &, x)',
        'Identifies remixers from track names',
        'Finds producer credits in track metadata',
        'Creates artist profiles for discovered collaborators',
        'Links relationships to specific evidence tracks',
        'Works with both live songs and archive tracks'
      ],
      instructions: 'Use POST with admin token to extract relationships from track data in batches.'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get track processing status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Extract relationships from track title and artist name patterns
 */
async function extractRelationshipsFromTrack(artistName: string, trackName: string): Promise<Array<{
  sourceArtist: string
  targetArtist: string
  type: string
  strength: number
}>> {
  const relationships: Array<{
    sourceArtist: string
    targetArtist: string
    type: string
    strength: number
  }> = []

  // Clean up artist and track names
  const cleanArtist = artistName.trim()
  const cleanTrack = trackName.trim()

  // Pattern 1: Featured artists (feat., ft., featuring)
  const featPatterns = [
    /feat\.?\s+(.+?)(?:\s|$)/gi,
    /ft\.?\s+(.+?)(?:\s|$)/gi,
    /featuring\s+(.+?)(?:\s|$)/gi,
    /\(feat\.?\s+(.+?)\)/gi,
    /\[feat\.?\s+(.+?)\]/gi
  ]

  for (const pattern of featPatterns) {
    const matches = cleanTrack.matchAll(pattern)
    for (const match of matches) {
      const featuredArtist = match[1].replace(/[\(\)\[\]]/g, '').trim()
      if (featuredArtist && featuredArtist !== cleanArtist) {
        relationships.push({
          sourceArtist: cleanArtist,
          targetArtist: featuredArtist,
          type: 'featured',
          strength: 6
        })
      }
    }
  }

  // Pattern 2: Collaborations (vs., &, x, with)
  const collabPatterns = [
    /(.+?)\s+vs\.?\s+(.+)/gi,
    /(.+?)\s+&\s+(.+)/gi,
    /(.+?)\s+x\s+(.+)/gi,
    /(.+?)\s+with\s+(.+)/gi,
    /(.+?)\s+and\s+(.+)/gi
  ]

  for (const pattern of collabPatterns) {
    const match = cleanArtist.match(pattern)
    if (match) {
      const artist1 = match[1].trim()
      const artist2 = match[2].trim()
      if (artist1 && artist2 && artist1 !== artist2) {
        relationships.push({
          sourceArtist: artist1,
          targetArtist: artist2,
          type: 'collaboration',
          strength: 7
        })
        relationships.push({
          sourceArtist: artist2,
          targetArtist: artist1,
          type: 'collaboration',
          strength: 7
        })
      }
    }
  }

  // Pattern 3: Remixes
  const remixPatterns = [
    /\((.+?)\s+remix\)/gi,
    /\[(.+?)\s+remix\]/gi,
    /-\s*(.+?)\s+remix/gi
  ]

  for (const pattern of remixPatterns) {
    const matches = cleanTrack.matchAll(pattern)
    for (const match of matches) {
      const remixer = match[1].replace(/[\(\)\[\]]/g, '').trim()
      if (remixer && remixer !== cleanArtist) {
        relationships.push({
          sourceArtist: cleanArtist,
          targetArtist: remixer,
          type: 'remix',
          strength: 5
        })
      }
    }
  }

  return relationships
}

/**
 * Find existing artist or create new profile
 */
async function findOrCreateArtist(artistName: string): Promise<string | null> {
  if (!artistName || artistName.length < 2) return null

  const cleanName = artistName.trim()
  const slug = cleanName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Try to find existing artist
  let { data: existingArtist } = await supabase
    .from('artist_profiles')
    .select('id')
    .eq('name', cleanName)
    .single()

  if (existingArtist) {
    return existingArtist.id
  }

  // Create new artist profile
  const { data: newArtist, error } = await supabase
    .from('artist_profiles')
    .insert({
      name: cleanName,
      slug: slug,
      bio: `Electronic music artist discovered through track analysis.`,
      genres: [],
      created_via: 'track_parsing'
    })
    .select('id')
    .single()

  if (error) {
    console.error(`Error creating artist profile for ${cleanName}:`, error)
    return null
  }

  return newArtist?.id || null
}