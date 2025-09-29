import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/artist-relationships/[id]
 * Fetch a specific artist relationship
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data, error } = await supabase
      .from('artist_relationships')
      .select(`
        *,
        source_artist:source_artist_id(id, name, slug),
        target_artist:target_artist_id(id, name, slug)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Relationship not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json({ relationship: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/artist-relationships/[id]
 * Update an artist relationship
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    const {
      relationship_type,
      strength,
      evidence_tracks,
      evidence_releases,
      notes,
      verified
    } = body

    const { data, error } = await supabase
      .from('artist_relationships')
      .update({
        relationship_type,
        strength,
        evidence_tracks,
        evidence_releases,
        notes,
        verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Relationship not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Relationship updated successfully',
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

/**
 * DELETE /api/artist-relationships/[id]
 * Delete an artist relationship
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { error } = await supabase
      .from('artist_relationships')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Relationship deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}