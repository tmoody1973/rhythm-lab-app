import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Song } from '@/lib/database/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const stationId = searchParams.get('station_id') || 'rlr-main'

    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('station_id', stationId)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch recent songs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      songs: songs || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}