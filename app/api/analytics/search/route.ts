import { NextRequest, NextResponse } from 'next/server'
import type { SearchAnalytics } from '@/lib/algolia/types'

export async function POST(request: NextRequest) {
  try {
    const analyticsData: SearchAnalytics = await request.json()

    // Validate the analytics data
    if (!analyticsData.event || !analyticsData.timestamp) {
      return NextResponse.json(
        { error: 'Missing required analytics fields' },
        { status: 400 }
      )
    }

    // Log analytics data (replace with your preferred storage/analytics service)
    console.log('Search Analytics:', {
      event: analyticsData.event,
      query: analyticsData.query,
      result_count: analyticsData.result_count,
      timestamp: analyticsData.timestamp,
      session_id: analyticsData.session_id,
      user_id: analyticsData.user_id,
      filters: analyticsData.filters
    })

    // Example: Store in database
    // await prisma.searchAnalytics.create({
    //   data: analyticsData
    // })

    // Example: Send to external analytics service
    // await sendToAnalyticsService(analyticsData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing search analytics:', error)
    return NextResponse.json(
      { error: 'Failed to process analytics data' },
      { status: 500 }
    )
  }
}

// Batch analytics endpoint
export async function PUT(request: NextRequest) {
  try {
    const { events }: { events: SearchAnalytics[] } = await request.json()

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      )
    }

    // Process batch analytics
    console.log(`Processing ${events.length} analytics events`)

    for (const event of events) {
      // Validate and process each event
      if (event.event && event.timestamp) {
        console.log('Batch Analytics Event:', {
          event: event.event,
          query: event.query,
          timestamp: event.timestamp
        })

        // Store in database or send to analytics service
        // await processAnalyticsEvent(event)
      }
    }

    return NextResponse.json({
      success: true,
      processed: events.length
    })
  } catch (error) {
    console.error('Error processing batch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to process batch analytics' },
      { status: 500 }
    )
  }
}