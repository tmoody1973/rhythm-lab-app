import { NextRequest, NextResponse } from 'next/server'
import type { SearchAnalytics } from '@/lib/algolia/types'

export async function POST(request: NextRequest) {
  try {
    const { events }: { events: SearchAnalytics[] } = await request.json()

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      )
    }

    console.log(`Processing batch of ${events.length} analytics events`)

    // Process events in batches for better performance
    const batchSize = 10
    const results = []

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)

      // Process each batch
      const batchResults = await Promise.allSettled(
        batch.map(async (event) => {
          // Validate event
          if (!event.event || !event.timestamp) {
            throw new Error('Invalid event data')
          }

          // Log for debugging (replace with actual storage)
          console.log('Analytics Event:', {
            event: event.event,
            query: event.query?.substring(0, 100), // Truncate long queries
            result_count: event.result_count,
            timestamp: event.timestamp,
            session_id: event.session_id
          })

          // Example: Store in database
          // return await storeAnalyticsEvent(event)

          return { success: true, event_id: event.timestamp }
        })
      )

      results.push(...batchResults)
    }

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      processed: successful,
      failed,
      total: events.length
    })
  } catch (error) {
    console.error('Error processing batch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to process batch analytics' },
      { status: 500 }
    )
  }
}