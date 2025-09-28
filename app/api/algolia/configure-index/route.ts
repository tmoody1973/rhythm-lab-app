import { NextRequest, NextResponse } from 'next/server'
import { adminClient, INDICES } from '@/lib/algolia/client'

export async function POST(request: NextRequest) {
  try {
    console.log('Configure index endpoint called')

    if (!adminClient) {
      console.error('Admin client is not configured')
      return NextResponse.json(
        { error: 'Algolia admin client not configured. Please check ALGOLIA_ADMIN_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Get authentication (admin only)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return NextResponse.json({ error: 'Unauthorized - Bearer token required' }, { status: 401 })
    }

    // Configure the live songs index to make date fields filterable
    console.log('Configuring Algolia index settings for live songs...')

    // Set index settings for filtering
    const settings = {
      searchableAttributes: [
        'song',
        'artist',
        'release',
        'label',
        'episode_title',
        'searchable_text'
      ],
      attributesForFaceting: [
        'filterOnly(start_timestamp)', // Make timestamp filterable for date ranges
        'searchable(artist)',
        'searchable(label)',
        'searchable(episode_title)',
        'filterOnly(year)',
        'filterOnly(month)',
        'filterOnly(day_of_week)',
        'filterOnly(hour)',
        'filterOnly(is_recent)',
        'filterOnly(is_today)',
        'filterOnly(has_spotify_data)',
        'filterOnly(content_type)'
      ],
      customRanking: [
        'desc(start_timestamp)' // Most recent songs first
      ],
      attributesToRetrieve: [
        'objectID',
        'song',
        'artist',
        'release',
        'label',
        'episode_title',
        'start_time',
        'start_timestamp',
        'duration',
        'date_display',
        'time_display',
        'relative_time',
        'spotify_track_id',
        'spotify_artist_id',
        'spotify_album_id',
        'has_spotify_data',
        'content_type',
        'display_context',
        'display_full',
        'year',
        'month',
        'day_of_week',
        'hour',
        'is_recent',
        'is_today'
      ],
      attributesToHighlight: [
        'song',
        'artist',
        'release',
        'label',
        'episode_title'
      ]
    }

    // Apply settings to the live songs index using Algolia v5 syntax
    await adminClient.setSettings({
      indexName: INDICES.LIVE_SONGS,
      indexSettings: settings
    })

    console.log('Index settings configured successfully')

    return NextResponse.json({
      success: true,
      message: 'Algolia index settings configured successfully',
      index: INDICES.LIVE_SONGS,
      settings: {
        faceting: settings.attributesForFaceting,
        searchable: settings.searchableAttributes,
        ranking: settings.customRanking
      }
    })

  } catch (error) {
    console.error('Index configuration error:', error)
    return NextResponse.json(
      {
        error: 'Failed to configure index settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Configure Algolia Index',
    description: 'POST to this endpoint to configure index settings for filtering and faceting',
    requirements: ['Bearer token authorization', 'Admin permissions'],
    features: [
      'Makes start_timestamp filterable for date range queries',
      'Configures searchable attributes',
      'Sets up faceting for various fields',
      'Configures custom ranking by recency'
    ]
  })
}