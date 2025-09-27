import { NextRequest, NextResponse } from 'next/server'
import { getPodcastHistory, getPodcastHistoryStats, searchPodcasts, addPodcastHistoryEntry, updatePodcastHistoryEntry } from '@/lib/podcast-history'

/**
 * GET /api/admin/podcast-history
 * Retrieve podcast generation history with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const stats = searchParams.get('stats') === 'true'
    const search = searchParams.get('search') || undefined

    // If stats requested, return summary statistics
    if (stats) {
      const statistics = await getPodcastHistoryStats()
      return NextResponse.json({
        success: true,
        stats: statistics
      })
    }

    // If search requested, return search results
    if (search) {
      const results = await searchPodcasts(search)
      return NextResponse.json({
        success: true,
        entries: results,
        total: results.length,
        page: 1,
        totalPages: 1
      })
    }

    // Get paginated podcast history
    const result = await getPodcastHistory(page, limit, status)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('Error retrieving podcast history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve podcast history',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/podcast-history
 * Create a new podcast history entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const entry = await addPodcastHistoryEntry({
      title: body.title,
      sourceType: body.sourceType || 'deep-dive',
      sourceId: body.sourceId,
      status: body.status || 'processing',
      script: body.script || null,
      audio: body.audio || null,
      storyblok: body.storyblok || null,
      podbean: body.podbean || null,
      errorMessage: body.errorMessage,
      metadata: {
        generatedBy: body.metadata?.generatedBy || 'system',
        ...body.metadata
      }
    })

    return NextResponse.json({
      success: true,
      entry
    })

  } catch (error: any) {
    console.error('Error creating podcast history entry:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create podcast history entry',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/podcast-history
 * Update an existing podcast history entry
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    const updatedEntry = await updatePodcastHistoryEntry(id, updates)

    if (!updatedEntry) {
      return NextResponse.json(
        { success: false, error: 'Podcast not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      entry: updatedEntry
    })

  } catch (error: any) {
    console.error('Error updating podcast history entry:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update podcast history entry',
        details: error.message
      },
      { status: 500 }
    )
  }
}