import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'YouTube API key not configured',
        hasApiKey: false,
        suggestions: [
          'Set YOUTUBE_API_KEY in .env.local',
          'Ensure the key is from Google Cloud Console',
          'Make sure YouTube Data API v3 is enabled'
        ]
      })
    }

    // Test basic API connectivity
    console.log('Testing YouTube API with key:', apiKey.substring(0, 10) + '...')

    const testUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    testUrl.searchParams.set('part', 'snippet')
    testUrl.searchParams.set('q', 'test music')
    testUrl.searchParams.set('type', 'video')
    testUrl.searchParams.set('maxResults', '1')
    testUrl.searchParams.set('key', apiKey)

    console.log('Making request to:', testUrl.toString().replace(apiKey, 'API_KEY_HIDDEN'))

    const response = await fetch(testUrl.toString())
    const responseText = await response.text()

    console.log('YouTube API Response:', response.status, responseText.substring(0, 500))

    if (!response.ok) {
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText }
      }

      return NextResponse.json({
        error: 'YouTube API request failed',
        status: response.status,
        statusText: response.statusText,
        hasApiKey: true,
        apiKeyLength: apiKey.length,
        response: data,
        diagnostics: {
          likely_causes: [
            'YouTube Data API v3 not enabled in Google Cloud Console',
            'API key restrictions preventing access',
            'Invalid or expired API key',
            'Billing not enabled for the project'
          ],
          next_steps: [
            '1. Go to Google Cloud Console (console.cloud.google.com)',
            '2. Enable YouTube Data API v3',
            '3. Check API key restrictions',
            '4. Ensure billing is enabled',
            '5. Test with a simple curl command'
          ]
        }
      }, { status: 400 })
    }

    const data = JSON.parse(responseText)

    return NextResponse.json({
      success: true,
      message: 'YouTube API is working correctly!',
      hasApiKey: true,
      apiKeyLength: apiKey.length,
      testResults: {
        found_videos: data.items?.length || 0,
        sample_title: data.items?.[0]?.snippet?.title || 'N/A',
        quota_used: '100 units (1 search)',
        api_version: 'v3'
      },
      next_steps: [
        'YouTube API is working',
        'You can now run the caching process',
        'Use POST /api/cache-youtube-videos to start caching'
      ]
    })

  } catch (error) {
    console.error('YouTube debug error:', error)
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.YOUTUBE_API_KEY,
      suggestions: [
        'Check network connectivity',
        'Verify API key is correctly formatted',
        'Try regenerating the API key in Google Cloud Console'
      ]
    }, { status: 500 })
  }
}