import { NextRequest, NextResponse } from 'next/server'
import { searchClient, INDICES } from '@/lib/algolia/client'

export async function GET(request: NextRequest) {
  try {
    if (!searchClient) {
      return NextResponse.json(
        { error: 'Algolia search client not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'articles'

    let indexName = INDICES.CONTENT
    if (type === 'songs') {
      indexName = INDICES.SONGS
    } else if (type === 'pages') {
      indexName = INDICES.PAGES
    }

    const results = await searchClient.search([{
      indexName,
      params: {
        query,
        hitsPerPage: 5,
        attributesToRetrieve: ['*']
      }
    }])

    // Extract just the hits for debugging
    const hits = results.results[0]?.hits || []

    return NextResponse.json({
      success: true,
      indexName,
      query,
      hitCount: hits.length,
      hits: hits.map(hit => ({
        objectID: hit.objectID,
        title: hit.title,
        content_type: hit.content_type,
        image: hit.image,
        featured_image: hit.featured_image,
        mixcloud_picture: hit.mixcloud_picture,
        allImageFields: {
          image: hit.image,
          featured_image: hit.featured_image,
          cover_image: hit.cover_image,
          photo: hit.photo,
          artist_photo: hit.artist_photo,
          hero_image: hit.hero_image,
          mixcloud_picture: hit.mixcloud_picture
        },
        // Include all fields to see what's available
        allFields: Object.keys(hit).sort()
      }))
    })

  } catch (error) {
    console.error('Debug search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform debug search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}