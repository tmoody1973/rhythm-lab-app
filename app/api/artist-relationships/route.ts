import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
 * GET /api/artist-relationships
 * Fetch artist relationships with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(request.url)

    const artistId = searchParams.get('artist_id')
    const relationshipType = searchParams.get('type')
    const minStrength = searchParams.get('min_strength')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('artist_relationships')
      .select(`
        *,
        source_artist:artist_profiles!source_artist_id(id, name, slug),
        target_artist:artist_profiles!target_artist_id(id, name, slug)
      `)

    // Apply filters
    if (artistId) {
      query = query.or(`source_artist_id.eq.${artistId},target_artist_id.eq.${artistId}`)
    }

    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType)
    }

    if (minStrength) {
      query = query.gte('strength', parseFloat(minStrength))
    }

    // Apply pagination
    query = query
      .order('strength', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500 }
      )
    }

    // Transform data for InfluenceGraph component
    const transformedRelationships = (data || []).map((rel: any) => ({
      id: rel.id,
      source_artist_name: rel.source_artist?.name || 'Unknown Artist',
      source_artist_slug: rel.source_artist?.slug || '',
      target_artist_name: rel.target_artist?.name || 'Unknown Artist',
      target_artist_slug: rel.target_artist?.slug || '',
      relationship_type: rel.relationship_type,
      strength: rel.strength,
      collaboration_count: rel.collaboration_count || 0,
      first_collaboration_date: rel.first_collaboration_date,
      last_collaboration_date: rel.last_collaboration_date,
      verified: rel.verified || false,
      evidence_tracks: rel.evidence_tracks || [],
      evidence_releases: rel.evidence_releases || [],
      notes: rel.notes
    }))

    return NextResponse.json({
      relationships: transformedRelationships,
      pagination: {
        limit,
        offset,
        hasMore: (data?.length || 0) === limit
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

/**
 * POST /api/artist-relationships
 * Create or update artist relationships
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()

    const {
      source_artist_id,
      target_artist_id,
      relationship_type,
      strength = 1.0,
      evidence_tracks = [],
      evidence_releases = [],
      notes,
      verified = false
    } = body

    // Validation
    if (!source_artist_id || !target_artist_id || !relationship_type) {
      return NextResponse.json(
        { error: 'Missing required fields: source_artist_id, target_artist_id, relationship_type' },
        { status: 400 }
      )
    }

    if (source_artist_id === target_artist_id) {
      return NextResponse.json(
        { error: 'Source and target artist cannot be the same' },
        { status: 400 }
      )
    }

    // Create the relationship
    const { data, error } = await supabase
      .from('artist_relationships')
      .upsert({
        source_artist_id,
        target_artist_id,
        relationship_type,
        strength,
        evidence_tracks,
        evidence_releases,
        notes,
        verified,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Relationship created successfully',
      relationship: data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}