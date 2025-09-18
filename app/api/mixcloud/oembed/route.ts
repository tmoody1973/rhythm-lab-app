import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/mixcloud/oembed
 * Proxy for Mixcloud oEmbed API to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Build oEmbed URL with parameters
    const oEmbedUrl = new URL('https://app.mixcloud.com/oembed/')
    oEmbedUrl.searchParams.set('url', url)
    oEmbedUrl.searchParams.set('format', 'json')

    // Pass through optional parameters
    const maxwidth = searchParams.get('maxwidth')
    const maxheight = searchParams.get('maxheight')
    const light = searchParams.get('light')

    if (maxwidth) oEmbedUrl.searchParams.set('maxwidth', maxwidth)
    if (maxheight) oEmbedUrl.searchParams.set('maxheight', maxheight)
    if (light) oEmbedUrl.searchParams.set('light', light)

    // Fetch from Mixcloud oEmbed API server-side (no CORS issues)
    const response = await fetch(oEmbedUrl.toString(), {
      headers: {
        'User-Agent': 'Rhythm Lab Radio App',
      },
    })

    if (!response.ok) {
      console.error('Mixcloud oEmbed API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Mixcloud API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return the oEmbed data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error in oEmbed proxy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch oEmbed data' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}