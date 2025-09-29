import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getArtistCollaborationNetwork as getDiscogsCollaborations,
  searchDiscogsArtist
} from '@/lib/external-apis/discogs'
import {
  getSpotifyArtistCollaborations,
  searchSpotifyArtist,
  getSpotifyRelatedArtists
} from '@/lib/spotify/api'

/**
 * POST /api/artist-relationships/discover
 * Discover artist relationships from external APIs (Discogs, Spotify)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      artist_name,
      artist_id,
      sources = ['discogs', 'spotify'],
      max_relationships = 50,
      include_producers = true,
      include_labels = true
    } = body

    if (!artist_name && !artist_id) {
      return NextResponse.json(
        { error: 'Either artist_name or artist_id is required' },
        { status: 400 }
      )
    }

    let targetArtistId = artist_id

    // If no artist_id provided, try to find or create the artist
    if (!targetArtistId && artist_name) {
      // Check if artist exists in database
      const { data: existingArtist } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('name', artist_name)
        .single()

      if (existingArtist) {
        targetArtistId = existingArtist.id
      } else {
        // Create new artist profile
        const { data: newArtist, error: createError } = await supabase
          .from('artist_profiles')
          .insert({
            name: artist_name,
            slug: artist_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            created_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating artist:', createError)
          return NextResponse.json(
            { error: 'Failed to create artist profile' },
            { status: 500 }
          )
        }

        targetArtistId = newArtist.id
      }
    }

    const discoveredRelationships = []
    const errors = []

    // Discover from Discogs
    if (sources.includes('discogs')) {
      try {
        console.log(`[Discover] Searching Discogs for: ${artist_name}`)

        const discogsArtist = await searchDiscogsArtist(artist_name)
        if (discogsArtist) {
          const collaborationNetwork = await getDiscogsCollaborations(
            discogsArtist.artistId,
            {
              maxReleases: 50,
              includeProducers: include_producers,
              includeLabels: include_labels
            }
          )

          // Process collaborators
          for (const [key, collaborator] of collaborationNetwork.collaborators.entries()) {
            if (collaborator.collaborationCount >= 1) {
              // Find or create collaborator artist profile
              const { data: collaboratorProfile } = await supabase
                .from('artist_profiles')
                .select('id')
                .eq('name', collaborator.artistName)
                .single()

              let collaboratorId = collaboratorProfile?.id

              if (!collaboratorId) {
                const { data: newCollaborator } = await supabase
                  .from('artist_profiles')
                  .insert({
                    name: collaborator.artistName,
                    slug: collaborator.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    discogs_id: collaborator.artistId || undefined
                  })
                  .select('id')
                  .single()

                collaboratorId = newCollaborator?.id
              }

              if (collaboratorId) {
                // Calculate relationship strength based on collaboration count
                const strength = Math.min(collaborator.collaborationCount * 1.5, 10)

                discoveredRelationships.push({
                  source_artist_id: targetArtistId,
                  target_artist_id: collaboratorId,
                  relationship_type: 'collaboration',
                  strength,
                  collaboration_count: collaborator.collaborationCount,
                  source_data: {
                    source: 'discogs',
                    discogs_artist_id: discogsArtist.artistId,
                    collaborator_discogs_id: collaborator.artistId,
                    roles: Array.from(collaborator.roles),
                    releases: collaborator.releases.slice(0, 5) // Limit evidence
                  },
                  evidence_releases: collaborator.releases.map(r => r.releaseId.toString()),
                  verified: false
                })
              }
            }
          }

          // Process label relationships
          if (include_labels) {
            for (const [key, label] of collaborationNetwork.labels.entries()) {
              await supabase
                .from('label_relationships')
                .upsert({
                  artist_id: targetArtistId,
                  label_name: label.labelName,
                  label_discogs_id: label.labelId,
                  release_count: label.releaseCount,
                  source_data: {
                    source: 'discogs',
                    releases: label.releases.slice(0, 10)
                  }
                })
            }
          }
        }
      } catch (error) {
        console.error('[Discover] Discogs error:', error)
        errors.push(`Discogs: ${error.message}`)
      }
    }

    // Discover from Spotify
    if (sources.includes('spotify')) {
      try {
        console.log(`[Discover] Searching Spotify for: ${artist_name}`)

        const spotifyArtist = await searchSpotifyArtist(artist_name)
        if (spotifyArtist) {
          // Update artist profile with Spotify ID
          await supabase
            .from('artist_profiles')
            .update({ spotify_id: spotifyArtist.id })
            .eq('id', targetArtistId)

          // Get collaborations
          const collaborationNetwork = await getSpotifyArtistCollaborations(
            spotifyArtist.id,
            { maxAlbums: 50, includeAppearances: true }
          )

          // Process collaborators
          for (const [key, collaborator] of collaborationNetwork.collaborators.entries()) {
            if (collaborator.trackCount >= 1) {
              // Find or create collaborator artist profile
              const { data: collaboratorProfile } = await supabase
                .from('artist_profiles')
                .select('id')
                .eq('name', collaborator.artistName)
                .single()

              let collaboratorId = collaboratorProfile?.id

              if (!collaboratorId) {
                const { data: newCollaborator } = await supabase
                  .from('artist_profiles')
                  .insert({
                    name: collaborator.artistName,
                    slug: collaborator.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    spotify_id: collaborator.artistId || undefined
                  })
                  .select('id')
                  .single()

                collaboratorId = newCollaborator?.id
              }

              if (collaboratorId) {
                // Calculate relationship strength
                const strength = Math.min(collaborator.trackCount * 1.0, 10)

                discoveredRelationships.push({
                  source_artist_id: targetArtistId,
                  target_artist_id: collaboratorId,
                  relationship_type: collaborator.collaborationType === 'featured_artist' ? 'featured' : 'collaboration',
                  strength,
                  collaboration_count: collaborator.trackCount,
                  source_data: {
                    source: 'spotify',
                    spotify_artist_id: spotifyArtist.id,
                    collaborator_spotify_id: collaborator.artistId,
                    collaboration_type: collaborator.collaborationType,
                    tracks: collaborator.tracks.slice(0, 5)
                  },
                  verified: false
                })
              }
            }
          }

          // Get related artists (musical influence/similarity)
          const relatedArtists = await getSpotifyRelatedArtists(spotifyArtist.id)
          for (const related of relatedArtists.slice(0, 10)) {
            // Find or create related artist profile
            const { data: relatedProfile } = await supabase
              .from('artist_profiles')
              .select('id')
              .eq('name', related.name)
              .single()

            let relatedId = relatedProfile?.id

            if (!relatedId) {
              const { data: newRelated } = await supabase
                .from('artist_profiles')
                .insert({
                  name: related.name,
                  slug: related.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                  spotify_id: related.id,
                  genres: related.genres
                })
                .select('id')
                .single()

              relatedId = newRelated?.id
            }

            if (relatedId) {
              // Strength based on popularity similarity
              const popularityDiff = Math.abs(spotifyArtist.popularity - related.popularity)
              const strength = Math.max(1, 10 - (popularityDiff / 10))

              discoveredRelationships.push({
                source_artist_id: targetArtistId,
                target_artist_id: relatedId,
                relationship_type: 'influence',
                strength,
                source_data: {
                  source: 'spotify_related',
                  spotify_artist_id: spotifyArtist.id,
                  related_spotify_id: related.id,
                  popularity_source: spotifyArtist.popularity,
                  popularity_target: related.popularity,
                  shared_genres: related.genres
                },
                verified: false
              })
            }
          }
        }
      } catch (error) {
        console.error('[Discover] Spotify error:', error)
        errors.push(`Spotify: ${error.message}`)
      }
    }

    // Batch insert relationships
    if (discoveredRelationships.length > 0) {
      const { data: insertedRelationships, error: insertError } = await supabase
        .from('artist_relationships')
        .upsert(discoveredRelationships, {
          onConflict: 'source_artist_id,target_artist_id,relationship_type',
          ignoreDuplicates: false
        })
        .select()

      if (insertError) {
        console.error('Error inserting relationships:', insertError)
        return NextResponse.json(
          { error: 'Failed to save discovered relationships' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Artist relationships discovered successfully',
        discovered_count: discoveredRelationships.length,
        relationships: insertedRelationships,
        errors: errors.length > 0 ? errors : undefined,
        artist_id: targetArtistId
      })
    } else {
      return NextResponse.json({
        message: 'No relationships discovered',
        discovered_count: 0,
        errors: errors.length > 0 ? errors : undefined,
        artist_id: targetArtistId
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}