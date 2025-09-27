import { NextRequest, NextResponse } from 'next/server'
import { getContentHistory, getContentHistoryStats } from '@/lib/content-history'

/**
 * GET /api/admin/content-history
 * Retrieve content generation history with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const contentType = searchParams.get('type') || undefined
    const stats = searchParams.get('stats') === 'true'

    // If stats requested, return summary statistics
    if (stats) {
      const statistics = await getContentHistoryStats()
      return NextResponse.json({
        success: true,
        stats: statistics
      })
    }

    // Get paginated content history
    const result = await getContentHistory(page, limit, contentType)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('Error retrieving content history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve content history',
        details: error.message
      },
      { status: 500 }
    )
  }
}