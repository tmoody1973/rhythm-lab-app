import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// MusicBrainz API functions
async function searchMusicBrainzArtist(artistName: string) {
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=artist:"${encodeURIComponent(artistName)}"&fmt=json&limit=1`,
      {
        headers: {
          'User-Agent': 'RhythmLabRadio/1.0.0 (contact@rhythmlabradio.com)'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 503) {
        console.log(`MusicBrainz rate limited for: ${artistName}`)
        return null
      }
      throw new Error(`MusicBrainz search failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.artists && data.artists.length > 0) {
      return {
        mbid: data.artists[0].id,
        name: data.artists[0].name,
        score: data.artists[0].score,
        type: data.artists[0].type,
        country: data.artists[0].country
      }
    }

    return null
  } catch (error) {
    console.error(`MusicBrainz search error for ${artistName}:`, error)
    return null
  }
}

async function getMusicBrainzRelationships(mbid: string) {
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/${mbid}?inc=artist-rels&fmt=json`,
      {
        headers: {
          'User-Agent': 'RhythmLabRadio/1.0.0 (contact@rhythmlabradio.com)'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 503) {
        console.log(`MusicBrainz rate limited for MBID: ${mbid}`)
        return []
      }
      throw new Error(`MusicBrainz relationships failed: ${response.status}`)
    }

    const data = await response.json()
    const relationships = []

    if (data.relations) {
      for (const relation of data.relations) {
        if (relation.artist) {
          relationships.push({
            type: relation.type,
            direction: relation.direction,
            artist: {
              name: relation.artist.name,
              mbid: relation.artist.id,
              sort_name: relation.artist['sort-name']
            }
          })
        }
      }
    }

    return relationships
  } catch (error) {
    console.error(`MusicBrainz relationships error for ${mbid}:`, error)
    return []
  }
}

// Wikipedia API functions
async function searchWikipediaArtist(artistName: string) {
  try {
    const searchResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistName)}&srlimit=1&format=json&origin=*`
    )

    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()

    if (searchData.query?.search?.length > 0) {
      const pageTitle = searchData.query.search[0].title

      // Get the actual page content
      const contentResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(pageTitle)}&exintro&explaintext&format=json&origin=*`
      )

      if (!contentResponse.ok) {
        throw new Error(`Wikipedia content failed: ${contentResponse.status}`)
      }

      const contentData = await contentResponse.json()
      const pages = contentData.query?.pages

      if (pages) {
        const pageId = Object.keys(pages)[0]
        const extract = pages[pageId]?.extract

        if (extract) {
          // Parse the extract for influences, collaborations, etc.
          const influences = parseWikipediaInfluences(extract, artistName)
          return {
            title: pageTitle,
            extract,
            influences
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error(`Wikipedia search error for ${artistName}:`, error)
    return null
  }
}

function parseWikipediaInfluences(text: string, artistName: string): string[] {
  const influences = new Set<string>()

  // Patterns to find influences and collaborations
  const patterns = [
    /influenced by ([^.]+)/gi,
    /inspired by ([^.]+)/gi,
    /collaborated with ([^.]+)/gi,
    /featuring ([^.]+)/gi,
    /worked with ([^.]+)/gi,
    /produced by ([^.]+)/gi
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        // Split by common separators and clean up
        const names = match[1]
          .split(/[,;&]/)
          .map(name => name.trim().replace(/^(and|the)\s+/i, ''))
          .filter(name => name && name !== artistName && name.length > 2)

        names.forEach(name => influences.add(name))
      }
    }
  }

  return Array.from(influences).slice(0, 10) // Limit to 10
}

// SpotScraper API functions
async function getSpotScraperTrackCredits(spotifyTrackId: string) {
  try {
    if (!process.env.SPOTSCRAPER_API_KEY) {
      console.log('SpotScraper API key not configured')
      return null
    }

    const response = await fetch(
      `https://api.spotscraper.com/v1/tracks/${spotifyTrackId}/credits`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SPOTSCRAPER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`SpotScraper rate limited for track: ${spotifyTrackId}`)
        return null
      }
      throw new Error(`SpotScraper credits failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract collaborators and relationships from credits
    const relationships = []
    if (data.producers) {
      for (const producer of data.producers.slice(0, 3)) {
        relationships.push({
          name: producer.name,
          type: 'producer'
        })
      }
    }

    if (data.writers) {
      for (const writer of data.writers.slice(0, 3)) {
        relationships.push({
          name: writer.name,
          type: 'songwriter'
        })
      }
    }

    if (data.performers) {
      for (const performer of data.performers.slice(0, 3)) {
        if (performer.role && performer.role.toLowerCase().includes('feat')) {
          relationships.push({
            name: performer.name,
            type: 'featured'
          })
        }
      }
    }

    return relationships

  } catch (error) {
    console.error(`SpotScraper credits error for ${spotifyTrackId}:`, error)
    return null
  }
}

// Discogs API functions
async function searchDiscogsArtist(artistName: string) {
  try {
    if (!process.env.DISCOGS_API_KEY) {
      console.log('Discogs API key not configured')
      return null
    }

    const response = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=1`,
      {
        headers: {
          'User-Agent': 'RhythmLabRadio/1.0.0 +http://rhythmlabradio.com',
          'Authorization': `Discogs key=${process.env.DISCOGS_API_KEY}, secret=${process.env.DISCOGS_SECRET}`
        }
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`Discogs rate limited for: ${artistName}`)
        return null
      }
      throw new Error(`Discogs search failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      return {
        id: data.results[0].id,
        name: data.results[0].title,
        resource_url: data.results[0].resource_url
      }
    }

    return null
  } catch (error) {
    console.error(`Discogs search error for ${artistName}:`, error)
    return null
  }
}

async function getDiscogsArtistReleases(artistId: string) {
  try {
    if (!process.env.DISCOGS_API_KEY) {
      return []
    }

    const response = await fetch(
      `https://api.discogs.com/artists/${artistId}/releases?per_page=10`,
      {
        headers: {
          'User-Agent': 'RhythmLabRadio/1.0.0 +http://rhythmlabradio.com',
          'Authorization': `Discogs key=${process.env.DISCOGS_API_KEY}, secret=${process.env.DISCOGS_SECRET}`
        }
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`Discogs rate limited for artist: ${artistId}`)
        return []
      }
      throw new Error(`Discogs releases failed: ${response.status}`)
    }

    const data = await response.json()
    const collaborators = []

    if (data.releases) {
      for (const release of data.releases.slice(0, 5)) {
        // Get detailed release information for credits
        try {
          const releaseResponse = await fetch(
            `https://api.discogs.com/releases/${release.id}`,
            {
              headers: {
                'User-Agent': 'RhythmLabRadio/1.0.0 +http://rhythmlabradio.com',
                'Authorization': `Discogs key=${process.env.DISCOGS_API_KEY}, secret=${process.env.DISCOGS_SECRET}`
              }
            }
          )

          if (releaseResponse.ok) {
            const releaseData = await releaseResponse.json()

            // Extract collaborators from credits
            if (releaseData.extraartists) {
              for (const artist of releaseData.extraartists.slice(0, 3)) {
                collaborators.push({
                  name: artist.name,
                  role: artist.role || 'collaborator'
                })
              }
            }

            // Small delay between release detail requests
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        } catch (err) {
          console.error(`Error getting Discogs release details for ${release.id}:`, err)
        }
      }
    }

    return collaborators

  } catch (error) {
    console.error(`Discogs releases error for ${artistId}:`, error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌐 Starting multi-API relationship enhancement...')

    const { limit = 20, offset = 0 } = await request.json().catch(() => ({}))

    // Get existing artist profiles
    const { data: artists, error } = await supabase
      .from('artist_profiles')
      .select('id, name, spotify_id')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log(`Found ${artists?.length || 0} artists to enhance`)

    let enhancedCount = 0
    let relationshipsCreated = 0
    const newRelationships: any[] = []

    for (const artist of artists || []) {
      try {
        console.log(`🔍 Processing: ${artist.name}`)

        let mbid = null

        // Step 1: Get MusicBrainz ID
        const mbArtist = await searchMusicBrainzArtist(artist.name)
        if (mbArtist) {
          mbid = mbArtist.mbid
          console.log(`✅ Found MusicBrainz: ${artist.name} (${mbid})`)
        }

        // Small delay to respect MusicBrainz rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Step 2: Get MusicBrainz relationships
        if (mbid) {
          const mbRelationships = await getMusicBrainzRelationships(mbid)
          console.log(`Found ${mbRelationships.length} MusicBrainz relationships for ${artist.name}`)

          for (const mbRel of mbRelationships.slice(0, 5)) { // Limit to 5
            try {
              // Check if related artist exists in our database
              let { data: existingArtist } = await supabase
                .from('artist_profiles')
                .select('id')
                .eq('name', mbRel.artist.name)
                .single()

              // Create artist profile if doesn't exist
              if (!existingArtist) {
                const { data: newArtist } = await supabase
                  .from('artist_profiles')
                  .insert({
                    name: mbRel.artist.name,
                    slug: mbRel.artist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    bio: `Artist related to ${artist.name} through MusicBrainz.`,
                    genres: ['Electronic']
                  })
                  .select('id')
                  .single()

                if (newArtist) {
                  existingArtist = newArtist
                }
              }

              if (existingArtist) {
                // Map MusicBrainz relationship types to our types
                let relationshipType = 'collaboration'
                if (mbRel.type === 'member of band') relationshipType = 'group_member'
                if (mbRel.type === 'collaboration') relationshipType = 'collaboration'
                if (mbRel.type === 'performance') relationshipType = 'featured'

                const relationship = {
                  source_artist_id: artist.id,
                  target_artist_id: existingArtist.id,
                  relationship_type: relationshipType,
                  strength: 7, // MusicBrainz relationships are quite reliable
                  source_data: {
                    source: 'musicbrainz',
                    relationship_type: mbRel.type,
                    direction: mbRel.direction,
                    processed_at: new Date().toISOString()
                  },
                  collaboration_count: 1,
                  verified: false
                }

                newRelationships.push(relationship)
              }
            } catch (err) {
              console.error(`Error processing MusicBrainz relationship for ${mbRel.artist.name}:`, err)
            }
          }

          // Small delay between MusicBrainz calls
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Step 3: Get Wikipedia influences
        const wikiData = await searchWikipediaArtist(artist.name)
        if (wikiData && wikiData.influences.length > 0) {
          console.log(`Found ${wikiData.influences.length} Wikipedia influences for ${artist.name}`)

          for (const influenceName of wikiData.influences.slice(0, 3)) { // Limit to 3
            try {
              // Check if influence artist exists in our database
              let { data: existingArtist } = await supabase
                .from('artist_profiles')
                .select('id')
                .ilike('name', influenceName)
                .single()

              // Create artist profile if doesn't exist
              if (!existingArtist) {
                const { data: newArtist } = await supabase
                  .from('artist_profiles')
                  .insert({
                    name: influenceName,
                    slug: influenceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    bio: `Artist mentioned as influence of ${artist.name} on Wikipedia.`
                  })
                  .select('id')
                  .single()

                if (newArtist) {
                  existingArtist = newArtist
                }
              }

              if (existingArtist) {
                const relationship = {
                  source_artist_id: existingArtist.id,
                  target_artist_id: artist.id,
                  relationship_type: 'influence',
                  strength: 5, // Wikipedia mentions are less certain
                  source_data: {
                    source: 'wikipedia',
                    page_title: wikiData.title,
                    processed_at: new Date().toISOString()
                  },
                  collaboration_count: 0,
                  verified: false
                }

                newRelationships.push(relationship)
              }
            } catch (err) {
              console.error(`Error processing Wikipedia influence ${influenceName}:`, err)
            }
          }

          // Small delay between Wikipedia calls
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Step 4: Get SpotScraper track credits if we have a Spotify ID
        if (artist.spotify_id) {
          const spotScraperCredits = await getSpotScraperTrackCredits(artist.spotify_id)
          if (spotScraperCredits && spotScraperCredits.length > 0) {
            console.log(`Found ${spotScraperCredits.length} SpotScraper credits for ${artist.name}`)

            for (const credit of spotScraperCredits) {
              try {
                // Check if credit artist exists in our database
                let { data: existingArtist } = await supabase
                  .from('artist_profiles')
                  .select('id')
                  .ilike('name', credit.name)
                  .single()

                // Create artist profile if doesn't exist
                if (!existingArtist) {
                  const { data: newArtist } = await supabase
                    .from('artist_profiles')
                    .insert({
                      name: credit.name,
                      slug: credit.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                      bio: `${credit.type} associated with ${artist.name} via SpotScraper.`,
                      genres: ['Electronic']
                    })
                    .select('id')
                    .single()

                  if (newArtist) {
                    existingArtist = newArtist
                  }
                }

                if (existingArtist) {
                  // Map SpotScraper credit types to our relationship types
                  let relationshipType = 'collaboration'
                  if (credit.type === 'producer') relationshipType = 'producer'
                  if (credit.type === 'featured') relationshipType = 'featured'
                  if (credit.type === 'songwriter') relationshipType = 'collaboration'

                  const relationship = {
                    source_artist_id: existingArtist.id,
                    target_artist_id: artist.id,
                    relationship_type: relationshipType,
                    strength: 8, // SpotScraper data is very reliable
                    source_data: {
                      source: 'spotscraper',
                      credit_type: credit.type,
                      processed_at: new Date().toISOString()
                    },
                    collaboration_count: 1,
                    verified: false
                  }

                  newRelationships.push(relationship)
                }
              } catch (err) {
                console.error(`Error processing SpotScraper credit ${credit.name}:`, err)
              }
            }

            // Small delay between SpotScraper calls
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }

        // Step 5: Get Discogs collaborations
        const discogsArtist = await searchDiscogsArtist(artist.name)
        if (discogsArtist) {
          const discogsCredits = await getDiscogsArtistReleases(discogsArtist.id)
          if (discogsCredits.length > 0) {
            console.log(`Found ${discogsCredits.length} Discogs collaborators for ${artist.name}`)

            for (const credit of discogsCredits.slice(0, 3)) { // Limit to 3
              try {
                // Check if collaborator exists in our database
                let { data: existingArtist } = await supabase
                  .from('artist_profiles')
                  .select('id')
                  .ilike('name', credit.name)
                  .single()

                // Create artist profile if doesn't exist
                if (!existingArtist) {
                  const { data: newArtist } = await supabase
                    .from('artist_profiles')
                    .insert({
                      name: credit.name,
                      slug: credit.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                      bio: `${credit.role} associated with ${artist.name} via Discogs.`,
                      genres: ['Electronic']
                    })
                    .select('id')
                    .single()

                  if (newArtist) {
                    existingArtist = newArtist
                  }
                }

                if (existingArtist) {
                  // Map Discogs roles to our relationship types
                  let relationshipType = 'collaboration'
                  if (credit.role && credit.role.toLowerCase().includes('producer')) relationshipType = 'producer'
                  if (credit.role && credit.role.toLowerCase().includes('remix')) relationshipType = 'remix'
                  if (credit.role && credit.role.toLowerCase().includes('feat')) relationshipType = 'featured'

                  const relationship = {
                    source_artist_id: existingArtist.id,
                    target_artist_id: artist.id,
                    relationship_type: relationshipType,
                    strength: 7, // Discogs data is quite reliable
                    source_data: {
                      source: 'discogs',
                      role: credit.role,
                      processed_at: new Date().toISOString()
                    },
                    collaboration_count: 1,
                    verified: false
                  }

                  newRelationships.push(relationship)
                }
              } catch (err) {
                console.error(`Error processing Discogs collaborator ${credit.name}:`, err)
              }
            }

            // Small delay between Discogs calls
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        enhancedCount++

        // Small delay between artists
        await new Promise(resolve => setTimeout(resolve, 200))

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
        console.error('Error inserting multi-API relationships:', insertError)
      } else {
        relationshipsCreated = newRelationships.length
        console.log(`✅ Created ${relationshipsCreated} new relationships from multiple APIs`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        artists_processed: artists?.length || 0,
        artists_enhanced: enhancedCount,
        relationships_created: relationshipsCreated,
        offset,
        limit,
        sources_used: ['musicbrainz', 'wikipedia', 'spotscraper', 'discogs']
      },
      next_batch: {
        offset: offset + limit,
        limit
      },
      message: `Enhanced ${enhancedCount} artists using MusicBrainz, Wikipedia, SpotScraper, and Discogs APIs, created ${relationshipsCreated} relationships.`
    })

  } catch (error) {
    console.error('Multi-API enhancement error:', error)
    console.error('Error type:', typeof error)
    console.error('Error JSON:', JSON.stringify(error, null, 2))

    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error)
    }

    return NextResponse.json({
      error: 'Failed to enhance relationships with multi-API data',
      details: errorMessage,
      errorType: typeof error
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get counts from database
    const [
      { count: totalArtists },
      { count: artistsWithMB },
      { count: allRelationships }
    ] = await Promise.all([
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true }).not('external_ids->musicbrainz_id', 'is', null),
      supabase.from('artist_relationships').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      status: 'ready',
      current_data: {
        total_artists: totalArtists || 0,
        artists_with_musicbrainz: artistsWithMB || 0,
        total_relationships: allRelationships || 0,
        enhancement_progress: `${artistsWithMB || 0}/${totalArtists || 0}`
      },
      endpoints: {
        enhance_relationships: 'POST /api/enhance-relationships-multi-api { limit: 20, offset: 0 }'
      },
      features: [
        'MusicBrainz artist relationships (collaborations, band members, etc.)',
        'Wikipedia influence parsing from article text',
        'SpotScraper track credits (producers, songwriters, featured artists)',
        'Discogs release credits and collaborations',
        'Automatic artist profile creation for discovered relationships',
        'Rate limiting to respect API guidelines',
        'Multiple relationship types: collaboration, influence, group_member, featured, producer, remix'
      ],
      instructions: 'Use POST with admin token to enhance artist relationships using MusicBrainz, Wikipedia, SpotScraper, and Discogs APIs'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get multi-API enhancement status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}