import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  extractArtistRelationshipsFromRelease,
  searchDiscogsArtist
} from '@/lib/external-apis/discogs'
import {
  getSpotifyTrackData,
  extractSpotifyCollaborations,
  searchSpotifyArtist
} from '@/lib/spotify/api'

/**
 * POST /api/artist-relationships/process-tracks
 * Background job to process existing tracks and build artist relationships
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      limit = 100,
      offset = 0,
      sources = ['spotify', 'discogs'],
      force_reprocess = false
    } = body

    console.log(`[Process Tracks] Starting batch processing: limit=${limit}, offset=${offset}`)

    // Get tracks that haven't been processed for relationships yet
    let query = supabase
      .from('tracks')
      .select('id, title, artist, album, label, spotify_track_id, discogs_release_id, track_metadata')

    if (!force_reprocess) {
      // Only process tracks that haven't been processed for relationships
      query = query.is('track_metadata->relationships_processed', null)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: tracks, error: tracksError } = await query

    if (tracksError) {
      console.error('Error fetching tracks:', tracksError)
      return NextResponse.json(
        { error: 'Failed to fetch tracks' },
        { status: 500 }
      )
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({
        message: 'No tracks to process',
        processed: 0,
        relationships_created: 0
      })
    }

    console.log(`[Process Tracks] Processing ${tracks.length} tracks`)

    let totalRelationshipsCreated = 0
    let processedTracks = 0

    for (const track of tracks) {
      try {
        console.log(`[Process Tracks] Processing: ${track.artist} - ${track.title}`)

        const trackRelationships = []
        let artistProfile = null

        // Find or create main artist profile
        const { data: existingArtist } = await supabase
          .from('artist_profiles')
          .select('id, name, discogs_id, spotify_id')
          .eq('name', track.artist)
          .single()

        if (existingArtist) {
          artistProfile = existingArtist
        } else {
          // Create new artist profile
          const { data: newArtist, error: createError } = await supabase
            .from('artist_profiles')
            .insert({
              name: track.artist,
              slug: track.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              created_at: new Date().toISOString()
            })
            .select('id, name')
            .single()

          if (createError) {
            console.error(`Error creating artist profile for ${track.artist}:`, createError)
            continue
          }

          artistProfile = newArtist
        }

        // Process Spotify data if available
        if (sources.includes('spotify')) {
          try {
            let spotifyData = null

            if (track.spotify_track_id) {
              // Use existing Spotify track ID
              console.log(`[Spotify] Using existing track ID: ${track.spotify_track_id}`)
            } else {
              // Search for track on Spotify
              spotifyData = await getSpotifyTrackData(track.artist, track.title)

              if (spotifyData?.track) {
                // Update track with Spotify ID
                await supabase
                  .from('tracks')
                  .update({
                    spotify_track_id: spotifyData.track.id,
                    track_metadata: {
                      ...(track.track_metadata || {}),
                      spotify_processed: new Date().toISOString()
                    }
                  })
                  .eq('id', track.id)
              }
            }

            if (spotifyData?.track) {
              const collaborations = extractSpotifyCollaborations(spotifyData.track)

              for (const collab of collaborations) {
                if (collab.artistName !== track.artist && collab.artistId) {
                  // Find or create collaborator profile
                  const { data: collaboratorProfile } = await supabase
                    .from('artist_profiles')
                    .select('id')
                    .eq('name', collab.artistName)
                    .single()

                  let collaboratorId = collaboratorProfile?.id

                  if (!collaboratorId) {
                    const { data: newCollaborator } = await supabase
                      .from('artist_profiles')
                      .insert({
                        name: collab.artistName,
                        slug: collab.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                        spotify_id: collab.artistId
                      })
                      .select('id')
                      .single()

                    collaboratorId = newCollaborator?.id
                  }

                  if (collaboratorId) {
                    trackRelationships.push({
                      source_artist_id: artistProfile.id,
                      target_artist_id: collaboratorId,
                      relationship_type: collab.type === 'featured_artist' ? 'featured' : 'collaboration',
                      strength: 2.0, // Base strength for track collaborations
                      collaboration_count: 1,
                      evidence_tracks: [track.id],
                      source_data: {
                        source: 'spotify_track',
                        track_id: track.id,
                        spotify_track_id: spotifyData.track.id,
                        collaboration_type: collab.type
                      },
                      verified: false
                    })

                    // Also create track credit
                    await supabase
                      .from('track_credits')
                      .upsert({
                        track_id: track.id,
                        artist_id: collaboratorId,
                        credit_type: collab.type,
                        source_api: 'spotify',
                        source_id: collab.artistId,
                        confidence: 0.9
                      })
                  }
                }
              }
            }
          } catch (spotifyError) {
            console.warn(`[Spotify] Error processing ${track.artist} - ${track.title}:`, spotifyError)
          }
        }

        // Process Discogs data if available
        if (sources.includes('discogs') && track.discogs_release_id) {
          try {
            console.log(`[Discogs] Processing release ID: ${track.discogs_release_id}`)

            const releaseData = await extractArtistRelationshipsFromRelease(
              track.discogs_release_id,
              'release'
            )

            for (const collab of releaseData.collaborations) {
              if (collab.artistName !== track.artist && collab.artistId) {
                // Find or create collaborator profile
                const { data: collaboratorProfile } = await supabase
                  .from('artist_profiles')
                  .select('id')
                  .eq('name', collab.artistName)
                  .single()

                let collaboratorId = collaboratorProfile?.id

                if (!collaboratorId) {
                  const { data: newCollaborator } = await supabase
                    .from('artist_profiles')
                    .insert({
                      name: collab.artistName,
                      slug: collab.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                      discogs_id: collab.artistId
                    })
                    .select('id')
                    .single()

                  collaboratorId = newCollaborator?.id
                }

                if (collaboratorId) {
                  trackRelationships.push({
                    source_artist_id: artistProfile.id,
                    target_artist_id: collaboratorId,
                    relationship_type: collab.creditType === 'producer' ? 'producer' : 'collaboration',
                    strength: collab.creditType === 'producer' ? 3.0 : 2.0,
                    collaboration_count: 1,
                    evidence_tracks: [track.id],
                    evidence_releases: [track.discogs_release_id.toString()],
                    source_data: {
                      source: 'discogs_release',
                      track_id: track.id,
                      discogs_release_id: track.discogs_release_id,
                      role: collab.role,
                      credit_type: collab.creditType
                    },
                    verified: false
                  })

                  // Also create track credit
                  await supabase
                    .from('track_credits')
                    .upsert({
                      track_id: track.id,
                      artist_id: collaboratorId,
                      credit_type: collab.creditType,
                      role_details: collab.role,
                      source_api: 'discogs',
                      source_id: collab.artistId?.toString(),
                      confidence: 0.8
                    })
                }
              }
            }

            // Process label relationships
            if (releaseData.labelInfo) {
              await supabase
                .from('label_relationships')
                .upsert({
                  artist_id: artistProfile.id,
                  label_name: releaseData.labelInfo.labelName,
                  label_discogs_id: releaseData.labelInfo.labelId,
                  release_count: 1,
                  source_data: {
                    source: 'discogs_track',
                    track_id: track.id,
                    discogs_release_id: track.discogs_release_id,
                    catalog_number: releaseData.labelInfo.catalogNumber
                  }
                })
            }
          } catch (discogsError) {
            console.warn(`[Discogs] Error processing release ${track.discogs_release_id}:`, discogsError)
          }
        }

        // Batch insert relationships
        if (trackRelationships.length > 0) {
          const { data: insertedRelationships, error: insertError } = await supabase
            .from('artist_relationships')
            .upsert(trackRelationships, {
              onConflict: 'source_artist_id,target_artist_id,relationship_type',
              ignoreDuplicates: false
            })
            .select()

          if (insertError) {
            console.error(`Error inserting relationships for track ${track.id}:`, insertError)
          } else {
            totalRelationshipsCreated += insertedRelationships?.length || 0
            console.log(`[Process Tracks] Created ${insertedRelationships?.length || 0} relationships for ${track.artist} - ${track.title}`)
          }
        }

        // Mark track as processed
        await supabase
          .from('tracks')
          .update({
            track_metadata: {
              ...(track.track_metadata || {}),
              relationships_processed: new Date().toISOString(),
              relationships_found: trackRelationships.length
            }
          })
          .eq('id', track.id)

        processedTracks++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (trackError) {
        console.error(`Error processing track ${track.id}:`, trackError)
        continue
      }
    }

    console.log(`[Process Tracks] Completed batch: processed=${processedTracks}, relationships=${totalRelationshipsCreated}`)

    return NextResponse.json({
      message: 'Track processing completed',
      processed: processedTracks,
      relationships_created: totalRelationshipsCreated,
      has_more: tracks.length === limit
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/artist-relationships/process-tracks
 * Get processing status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get processing statistics
    const [
      { count: totalTracks },
      { count: processedTracks },
      { count: totalRelationships },
      { count: totalArtists }
    ] = await Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }),
      supabase.from('tracks').select('*', { count: 'exact', head: true }).not('track_metadata->relationships_processed', 'is', null),
      supabase.from('artist_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('artist_profiles').select('*', { count: 'exact', head: true })
    ])

    const processingProgress = totalTracks > 0 ? (processedTracks / totalTracks) * 100 : 0

    return NextResponse.json({
      statistics: {
        total_tracks: totalTracks,
        processed_tracks: processedTracks,
        unprocessed_tracks: totalTracks - processedTracks,
        processing_progress: Math.round(processingProgress * 100) / 100,
        total_relationships: totalRelationships,
        total_artists: totalArtists
      },
      next_batch: {
        offset: processedTracks,
        limit: Math.min(100, totalTracks - processedTracks)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}