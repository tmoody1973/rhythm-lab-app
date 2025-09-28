import { NextRequest, NextResponse } from 'next/server'

// Simple configuration that doesn't require auth to test if Algolia is working
export async function POST(request: NextRequest) {
  try {
    console.log('Simple configure endpoint called')

    // Check if environment variables exist
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
    const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY
    const indexName = process.env.ALGOLIA_LIVE_SONGS_INDEX || 'rhythm_lab_live_songs'

    if (!appId || !adminApiKey) {
      return NextResponse.json({
        error: 'Missing Algolia configuration',
        details: {
          hasAppId: !!appId,
          hasAdminKey: !!adminApiKey,
          indexName
        }
      }, { status: 500 })
    }

    // Try a simple direct API call to Algolia
    const url = `https://${appId}-dsn.algolia.net/1/indexes/${indexName}/settings`

    const settings = {
      attributesForFaceting: [
        'filterOnly(start_timestamp)'
      ]
    }

    console.log(`Calling Algolia API: ${url}`)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-Algolia-Application-Id': appId,
        'X-Algolia-API-Key': adminApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Algolia API error:', result)
      return NextResponse.json({
        error: 'Algolia API error',
        details: result
      }, { status: response.status })
    }

    console.log('Settings updated successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Date filtering enabled successfully',
      taskID: result.taskID,
      indexName
    })

  } catch (error) {
    console.error('Configuration error:', error)
    return NextResponse.json({
      error: 'Failed to configure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Simple Algolia Configuration',
    description: 'Directly configures Algolia index to enable date filtering',
    note: 'This is a simplified version for testing'
  })
}