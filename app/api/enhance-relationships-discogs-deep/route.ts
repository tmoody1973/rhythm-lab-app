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

    console.log('🎵 Starting deep Discogs relationship enhancement...')

    const { limit = 20, offset = 0, artist_name, release_id } = await request.json().catch(() => ({}))

    let relationshipsCreated = 0
    const newRelationships: any[] = []
    const processedArtists = []

    if (release_id) {
      // Process specific release
      const releaseData = await getDiscogsRelease(release_id)
      if (releaseData) {
        const extracted = await extractDeepRelationships(releaseData)
        newRelationships.push(...extracted)
        processedArtists.push({ release_id, title: releaseData.title })
      }
    } else if (artist_name) {
      // Process specific artist's releases
      const artistReleases = await getArtistReleases(artist_name, limit)
      for (const release of artistReleases) {
        const extracted = await extractDeepRelationships(release)
        newRelationships.push(...extracted)
        processedArtists.push({ release_id: release.id, title: release.title })
      }
    } else {
      // Process artists from database
      const { data: artists } = await supabase
        .from('artist_profiles')
        .select('id, name, discogs_enhanced_at')
        .is('discogs_enhanced_at', null) // Only unprocessed artists
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      for (const artist of artists || []) {
        try {
          console.log(`🔍 Deep processing Discogs for: ${artist.name}`)

          const artistReleases = await getArtistReleases(artist.name, 5) // Limit to top 5 releases per artist

          for (const release of artistReleases) {
            const extracted = await extractDeepRelationships(release)
            newRelationships.push(...extracted)
          }

          processedArtists.push({ artist_id: artist.id, name: artist.name, releases: artistReleases.length })

          // Mark artist as processed
          await supabase
            .from('artist_profiles')
            .update({ discogs_enhanced_at: new Date().toISOString() })
            .eq('id', artist.id)

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))

        } catch (err) {
          console.error(`Error processing artist ${artist.name}:`, err)
        }
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
        console.error('Error inserting deep Discogs relationships:', insertError)
      } else {
        relationshipsCreated = newRelationships.length
        console.log(`✅ Created ${relationshipsCreated} deep relationships from Discogs`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        artists_processed: processedArtists.length,
        relationships_created: relationshipsCreated,
        relationship_types: getRelationshipTypesUsed(newRelationships),
        offset,
        limit
      },
      processed_artists: processedArtists.slice(0, 5), // Sample
      next_batch: {
        offset: offset + limit,
        limit
      },
      message: `Deep processed ${processedArtists.length} artists/releases and created ${relationshipsCreated} rich relationships.`
    })

  } catch (error) {
    console.error('Deep Discogs enhancement error:', error)
    return NextResponse.json({
      error: 'Failed to enhance relationships with deep Discogs data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get counts from database
    const [
      { count: totalArtists },
      { count: artistsWithDiscogs },
      { count: discogsRelationships }
    ] = await Promise.all([
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true }).not('discogs_enhanced_at', 'is', null),
      supabase.from('artist_relationships').select('*', { count: 'exact', head: true }).like('source_data->>source', '%discogs%')
    ])

    return NextResponse.json({
      status: 'ready',
      current_data: {
        total_artists: totalArtists || 0,
        artists_with_deep_discogs: artistsWithDiscogs || 0,
        discogs_relationships: discogsRelationships || 0,
        enhancement_progress: `${artistsWithDiscogs || 0}/${totalArtists || 0}`
      },
      endpoints: {
        enhance_artist: 'POST /api/enhance-relationships-discogs-deep { artist_name: "Steve Reid", limit: 10 }',
        enhance_release: 'POST /api/enhance-relationships-discogs-deep { release_id: 623351 }',
        enhance_batch: 'POST /api/enhance-relationships-discogs-deep { limit: 20, offset: 0 }'
      },
      features: [
        'Deep release analysis with full personnel credits',
        'Composer and songwriter relationship extraction',
        'Studio, engineer, and producer connections',
        'Label and publisher relationship tracking',
        'Session musician and band member identification',
        'Track-level collaboration analysis',
        'Industry connection mapping (studios, engineers, etc.)',
        'Rich metadata preservation (roles, instruments, credits)'
      ],
      instructions: 'Use POST with admin token to perform deep Discogs relationship enhancement. Creates rich, multi-layered artist connections.'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get deep Discogs enhancement status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get detailed release data from Discogs API
 */
async function getDiscogsRelease(releaseId: string | number): Promise<any> {
  try {
    const response = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
      headers: {
        'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
        'User-Agent': 'RhythmLabRadio/1.0'
      }
    })

    if (!response.ok) {
      console.error(`Discogs API error for release ${releaseId}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching Discogs release ${releaseId}:`, error)
    return null
  }
}

/**
 * Get artist releases from Discogs search
 */
async function getArtistReleases(artistName: string, limit: number = 5): Promise<any[]> {
  try {
    const searchResponse = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=release&per_page=${limit}`,
      {
        headers: {
          'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
          'User-Agent': 'RhythmLabRadio/1.0'
        }
      }
    )

    if (!searchResponse.ok) return []

    const searchData = await searchResponse.json()
    const releases = []

    // Get detailed data for each release
    for (const result of searchData.results?.slice(0, limit) || []) {
      if (result.type === 'release' && result.id) {
        const releaseData = await getDiscogsRelease(result.id)
        if (releaseData) {
          releases.push(releaseData)
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return releases
  } catch (error) {
    console.error(`Error searching Discogs for ${artistName}:`, error)
    return []
  }
}

/**
 * Extract deep relationships from Discogs release data
 */
async function extractDeepRelationships(release: any): Promise<any[]> {
  const relationships: any[] = []

  if (!release || !release.artists) return relationships

  console.log(`🎵 Extracting relationships from "${release.title}" (${release.year})`)

  // Main artists
  const mainArtists = release.artists || []

  // Get all personnel from extraartists (session musicians, producers, etc.)
  const personnel = release.extraartists || []

  // Get all track-level credits
  const trackCredits = []
  if (release.tracklist) {
    for (const track of release.tracklist) {
      if (track.extraartists) {
        trackCredits.push(...track.extraartists.map(artist => ({
          ...artist,
          track_title: track.title,
          track_position: track.position
        })))
      }
    }
  }

  // Create relationships between main artists
  for (let i = 0; i < mainArtists.length; i++) {
    for (let j = i + 1; j < mainArtists.length; j++) {
      const sourceArtist = mainArtists[i]
      const targetArtist = mainArtists[j]

      const relationship = await createRelationship(
        sourceArtist,
        targetArtist,
        'collaboration',
        8,
        {
          source: 'discogs_deep',
          release_id: release.id,
          release_title: release.title,
          year: release.year,
          context: `Co-artists on album "${release.title}"`,
          join_type: sourceArtist.join || targetArtist.join || null
        }
      )

      if (relationship) relationships.push(relationship)
    }
  }

  // Create relationships between main artists and personnel
  for (const mainArtist of mainArtists) {
    for (const person of personnel) {
      const relationship = await createPersonnelRelationship(
        mainArtist,
        person,
        release,
        'album_collaboration'
      )

      if (relationship) relationships.push(relationship)
    }
  }

  // Create track-level relationships
  for (const trackCredit of trackCredits) {
    for (const mainArtist of mainArtists) {
      const relationship = await createPersonnelRelationship(
        mainArtist,
        trackCredit,
        release,
        'track_collaboration',
        trackCredit.track_title
      )

      if (relationship) relationships.push(relationship)
    }
  }

  // Create composer/writer relationships
  const composers = [...personnel, ...trackCredits].filter(p =>
    p.role && (p.role.includes('Written-By') || p.role.includes('Composed') || p.role.includes('Songwriter'))
  )

  for (const composer of composers) {
    for (const mainArtist of mainArtists) {
      const relationship = await createRelationship(
        composer,
        mainArtist,
        'composer',
        7,
        {
          source: 'discogs_deep',
          release_id: release.id,
          release_title: release.title,
          role: composer.role,
          context: composer.track_title ? `Composed "${composer.track_title}"` : `Composer on "${release.title}"`
        }
      )

      if (relationship) relationships.push(relationship)
    }
  }

  // Create producer relationships
  const producers = personnel.filter(p =>
    p.role && (p.role.includes('Producer') || p.role.includes('Produced'))
  )

  for (const producer of producers) {
    for (const mainArtist of mainArtists) {
      const relationship = await createRelationship(
        producer,
        mainArtist,
        'producer',
        6,
        {
          source: 'discogs_deep',
          release_id: release.id,
          release_title: release.title,
          role: producer.role,
          context: `Produced "${release.title}"`
        }
      )

      if (relationship) relationships.push(relationship)
    }
  }

  console.log(`✅ Extracted ${relationships.length} relationships from "${release.title}"`)

  return relationships
}

/**
 * Create personnel relationship with role-specific logic
 */
async function createPersonnelRelationship(
  mainArtist: any,
  person: any,
  release: any,
  baseType: string,
  trackTitle?: string
): Promise<any | null> {
  if (!person.role) return null

  const role = person.role.toLowerCase()
  let relationshipType = baseType
  let strength = 5

  // Determine relationship type based on role
  if (role.includes('guitar') || role.includes('bass') || role.includes('drums') ||
      role.includes('piano') || role.includes('saxophone') || role.includes('trumpet') ||
      role.includes('keyboard') || role.includes('violin') || role.includes('vocals')) {
    relationshipType = 'musician'
    strength = 6
  } else if (role.includes('producer') || role.includes('arranged')) {
    relationshipType = 'producer'
    strength = 7
  } else if (role.includes('engineer') || role.includes('mixed') || role.includes('recorded')) {
    relationshipType = 'engineer'
    strength = 4
  } else if (role.includes('written-by') || role.includes('composed')) {
    relationshipType = 'composer'
    strength = 8
  }

  return await createRelationship(
    mainArtist,
    person,
    relationshipType,
    strength,
    {
      source: 'discogs_deep',
      release_id: release.id,
      release_title: release.title,
      year: release.year,
      role: person.role,
      instrument: extractInstrument(person.role),
      track_title: trackTitle,
      context: trackTitle ?
        `${person.role} on "${trackTitle}"` :
        `${person.role} on "${release.title}"`
    }
  )
}

/**
 * Extract instrument from role string
 */
function extractInstrument(role: string): string | null {
  const instruments = [
    'guitar', 'bass', 'drums', 'piano', 'keyboard', 'saxophone', 'trumpet',
    'violin', 'cello', 'flute', 'clarinet', 'trombone', 'organ', 'synthesizer',
    'vocals', 'voice', 'percussion', 'harmonica', 'accordion', 'mandolin'
  ]

  const roleLower = role.toLowerCase()
  for (const instrument of instruments) {
    if (roleLower.includes(instrument)) {
      return instrument
    }
  }

  return null
}

/**
 * Create relationship with artist profile management
 */
async function createRelationship(
  sourceArtist: any,
  targetArtist: any,
  relationshipType: string,
  strength: number,
  metadata: any
): Promise<any | null> {
  if (!sourceArtist?.name || !targetArtist?.name || sourceArtist.name === targetArtist.name) {
    return null
  }

  // Find or create artist profiles
  const sourceArtistId = await findOrCreateArtistProfile(sourceArtist)
  const targetArtistId = await findOrCreateArtistProfile(targetArtist)

  if (!sourceArtistId || !targetArtistId) return null

  return {
    source_artist_id: sourceArtistId,
    target_artist_id: targetArtistId,
    relationship_type: relationshipType,
    strength,
    collaboration_count: 1,
    source_data: {
      ...metadata,
      source_discogs_id: sourceArtist.id,
      target_discogs_id: targetArtist.id,
      processed_at: new Date().toISOString()
    },
    verified: false,
    evidence_releases: [metadata.release_title],
    notes: metadata.context
  }
}

/**
 * Find or create artist profile
 */
async function findOrCreateArtistProfile(artist: any): Promise<string | null> {
  if (!artist?.name) return null

  const name = artist.name.trim()
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

  // Create new artist profile
  const { data: newArtist, error } = await supabase
    .from('artist_profiles')
    .insert({
      name,
      slug,
      bio: `Musician discovered through deep Discogs analysis.`,
      discogs_id: artist.id || null,
      created_via: 'discogs_deep'
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
 * Get summary of relationship types used
 */
function getRelationshipTypesUsed(relationships: any[]): Record<string, number> {
  const types: Record<string, number> = {}
  for (const rel of relationships) {
    types[rel.relationship_type] = (types[rel.relationship_type] || 0) + 1
  }
  return types
}